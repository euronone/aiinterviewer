"""
Applications API — Resume Upload, AI Parsing, JD Matching, Auto-Invite.
Core screening pipeline.
"""
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, BackgroundTasks
from typing import Optional

from app.core.database import get_supabase, get_redis
from app.core.config import settings
from app.schemas.schemas import ApplicationResponse, ApplyResponse, ApplicationStatus
from app.services.resume_parser import resume_parser
from app.services.matching_engine import get_matching_engine
from app.services.email_service import send_interview_invite
from app.api.v1.endpoints.auth import get_current_user
import boto3

router = APIRouter()


async def upload_resume_to_s3(file: UploadFile, application_id: str) -> str:
    """Upload resume file to AWS S3 and return public URL."""
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    
    extension = file.filename.split(".")[-1].lower()
    key = f"resumes/{application_id}/{uuid.uuid4()}.{extension}"
    
    content = await file.read()
    s3.put_object(
        Bucket=settings.AWS_S3_BUCKET,
        Key=key,
        Body=content,
        ContentType=file.content_type,
        ServerSideEncryption="AES256",
    )
    
    return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"


async def run_screening_pipeline(
    application_id: str,
    job_id: str,
    resume_text: str,
    candidate_email: str,
    candidate_name: str,
):
    """
    Background task: Parse resume → Generate embeddings → Match with JD → 
    Update DB → Send invite if threshold met.
    """
    supabase = get_supabase()
    redis_client = await get_redis()

    try:
        # 1. Parse resume
        parsed_data = await resume_parser.parse_resume(resume_text)
        
        # 2. Fetch JD (from Redis cache or DB)
        jd_cache_key = f"jd:embedding:{job_id}"
        cached = await redis_client.get(jd_cache_key)
        
        if cached:
            import json
            jd_data = json.loads(cached)
        else:
            job = supabase.table("jobs").select("description, requirements_embedding, requirements, experience_min").eq("id", job_id).single().execute()
            jd_data = job.data if job.data else {}
            if jd_data:
                await redis_client.setex(jd_cache_key, settings.REDIS_TTL, json.dumps(jd_data))
        
        # 3. Compute match score
        engine = get_matching_engine()
        match_score = await engine.compute_match_score(
            parsed_resume=parsed_data,
            job_id=job_id,
            job_description=jd_data.get("description", ""),
            required_skills=jd_data.get("requirements", []),
            min_experience=jd_data.get("experience_min", 0),
        )
        
        # 5. Update application
        new_status = (
            ApplicationStatus.INVITED.value
            if match_score >= settings.MATCH_THRESHOLD
            else ApplicationStatus.APPLIED.value
        )
        
        supabase.table("applications").update({
            "parsed_data": parsed_data.model_dump(),
            "match_score": match_score,
            "status": new_status,
        }).eq("id", application_id).execute()
        
        # 6. Send interview invite if qualified
        if match_score >= settings.MATCH_THRESHOLD:
            schedule_link = f"{settings.FRONTEND_URL}/candidate/schedule/{application_id}"
            await send_interview_invite(
                to_email=candidate_email,
                candidate_name=candidate_name,
                match_score=int(match_score * 100),
                schedule_link=schedule_link,
            )

    except Exception as e:
        print(f"❌ Screening pipeline failed for application {application_id}: {e}")
        supabase.table("applications").update({
            "status": ApplicationStatus.APPLIED.value,
        }).eq("id", application_id).execute()


@router.post("/apply", response_model=ApplyResponse, status_code=201)
async def apply_for_job(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: Optional[str] = Form(None),
    resume: UploadFile = File(...),
):
    """
    Submit job application with resume.
    Triggers async pipeline: parse → match → invite.
    """
    supabase = get_supabase()
    
    # Validate file type
    allowed_types = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if resume.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted.")
    
    # Validate file size (5MB max)
    content = await resume.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB.")
    
    await resume.seek(0)  # Reset file pointer
    
    # Check job exists
    job = supabase.table("jobs").select("id, is_active").eq("id", job_id).execute()
    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found.")
    if not job.data[0]["is_active"]:
        raise HTTPException(status_code=400, detail="This job is no longer accepting applications.")
    
    # Check duplicate application
    existing = supabase.table("applications").select("id").eq("job_id", job_id).eq("candidate_email", candidate_email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="You have already applied for this position.")
    
    # Create candidate user if not exists
    user = supabase.table("users").select("id").eq("email", candidate_email).execute()
    if user.data:
        candidate_id = user.data[0]["id"]
    else:
        candidate_id = str(uuid.uuid4())
        supabase.table("users").insert({
            "id": candidate_id,
            "name": candidate_name,
            "email": candidate_email,
            "phone": candidate_phone,
            "role": "candidate",
        }).execute()
    
    # Create application record
    application_id = str(uuid.uuid4())
    
    # Upload resume
    resume_url = await upload_resume_to_s3(resume, application_id)
    
    supabase.table("applications").insert({
        "id": application_id,
        "job_id": job_id,
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "resume_url": resume_url,
        "status": ApplicationStatus.APPLIED.value,
    }).execute()
    
    # Queue background processing
    resume_text = content.decode("utf-8", errors="ignore")
    background_tasks.add_task(
        run_screening_pipeline,
        application_id=application_id,
        job_id=job_id,
        resume_text=resume_text,
        candidate_email=candidate_email,
        candidate_name=candidate_name,
    )
    
    return ApplyResponse(
        application_id=application_id,
        match_score=0.0,  # Processing async
        status=ApplicationStatus.APPLIED,
        message="Your application is being reviewed. You will hear from us shortly.",
        interview_invited=False,
    )


@router.get("/{application_id}/status", response_model=ApplicationResponse)
async def get_application_status(application_id: str):
    """Poll application status after submission."""
    supabase = get_supabase()
    result = supabase.table("applications").select("*").eq("id", application_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    return result.data[0]


@router.get("/", response_model=list[ApplicationResponse])
async def list_applications(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List applications — Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    query = supabase.table("applications").select("*")
    
    if job_id:
        query = query.eq("job_id", job_id)
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).execute()
    return result.data
