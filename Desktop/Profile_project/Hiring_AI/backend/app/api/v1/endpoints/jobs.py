"""Jobs API — Create, list, update job postings with JD embedding generation."""
import uuid
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.database import get_supabase, get_redis
from app.schemas.schemas import JobCreate, JobResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_jd_embedding(job: JobCreate) -> list[float]:
    """Generate vector embedding for JD semantic matching."""
    jd_text = f"""
    Job Title: {job.title}
    Department: {job.department or ''}
    Description: {job.description}
    Requirements: {', '.join(job.requirements)}
    Experience Required: {job.experience_min}-{job.experience_max or '+'} years
    """
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=jd_text.strip(),
    )
    return response.data[0].embedding


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(
    data: JobCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new job posting. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    redis_client = await get_redis()
    
    # Generate JD embedding for semantic search
    embedding = await generate_jd_embedding(data)
    
    job_id = str(uuid.uuid4())
    job_data = {
        "id": job_id,
        "title": data.title,
        "description": data.description,
        "requirements": data.requirements,
        "department": data.department,
        "location": data.location,
        "employment_type": data.employment_type,
        "experience_min": data.experience_min,
        "experience_max": data.experience_max,
        "budget_min": data.budget_min,
        "budget_max": data.budget_max,
        "is_active": data.is_active,
        "created_by": current_user["sub"],
    }
    
    result = supabase.table("jobs").insert(job_data).execute()
    
    # Cache the JD embedding in Redis
    await redis_client.setex(
        f"jd:embedding:{job_id}",
        settings.REDIS_TTL,
        json.dumps({
            "description": data.description,
            "requirements": data.requirements,
            "requirements_embedding": embedding,
        }),
    )
    
    return {**result.data[0], "applications_count": 0}


@router.get("/", response_model=list[JobResponse])
async def list_jobs(
    is_active: Optional[bool] = Query(True),
    department: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    """List all active job postings — public endpoint."""
    supabase = get_supabase()
    query = supabase.table("jobs").select("*")
    
    if is_active is not None:
        query = query.eq("is_active", is_active)
    if department:
        query = query.eq("department", department)
    
    result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
    return result.data


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get single job details — public."""
    supabase = get_supabase()
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    return result.data


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update job status or details. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    
    # Only allow safe updates
    allowed_fields = {"status", "title", "description", "salary_min", "salary_max", "location"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    result = supabase.table("jobs").update(safe_updates).eq("id", job_id).execute()
    return result.data[0]


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Soft-delete (archive) a job. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    supabase.table("jobs").update({"status": "archived"}).eq("id", job_id).execute()


@router.get("/{job_id}/candidates")
async def get_job_candidates(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    min_score: float = Query(0.0),
):
    """Get ranked candidate list for a job. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    result = (
        supabase.table("applications")
        .select("*, users(name, email, phone)")
        .eq("job_id", job_id)
        .gte("match_score", min_score)
        .order("match_score", desc=True)
        .execute()
    )
    return result.data
