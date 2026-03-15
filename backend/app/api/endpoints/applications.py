from fastapi import APIRouter, HTTPException
from app.schemas.schemas import ApplicationCreate, ApplicationResponse
from typing import List, Dict, Any, Optional
from app.services.ai_service import resume_parser
from app.services.matching_engine import compute_match_score, MATCH_THRESHOLD
from app.api.endpoints.jobs import MOCK_JOBS, list_jobs, is_supabase_configured
from app.db.supabase import supabase
import uuid

router = APIRouter()

# In-memory store when Supabase not configured (BRD: application status, match_score)
APPLICATIONS: Dict[str, dict] = {}


def _get_job(job_id: str) -> Optional[dict]:
    if is_supabase_configured():
        try:
            r = supabase.table("jobs").select("*").eq("id", job_id).execute()
            return r.data[0] if r.data else None
        except Exception:
            return None
    return next((j for j in MOCK_JOBS if j["id"] == job_id), None)


@router.post("/", response_model=ApplicationResponse)
def apply_job(application: ApplicationCreate):
    """BRD: Apply, parse resume, JD matching, auto-invite if match_score >= threshold."""
    parsed_data = resume_parser.parse_resume(application.resume_text)
    job = _get_job(application.job_id)
    job_description = (job.get("description") or "") if job else ""
    job_requirements = job.get("requirements") or []
    match_score = compute_match_score(parsed_data, job_requirements, job_description)
    status = "invited" if match_score >= MATCH_THRESHOLD else "pending_review"
    app_id = str(uuid.uuid4())
    payload = {
        "id": app_id,
        "job_id": application.job_id,
        "name": application.name,
        "email": application.email,
        "phone": application.phone,
        "resume_text": application.resume_text,
        "status": status,
        "match_score": match_score,
        "parsed_data": parsed_data,
        "interview_id": None,
    }
    APPLICATIONS[app_id] = payload
    return payload


@router.get("/status/{application_id}", response_model=ApplicationResponse)
def get_application_status(application_id: str):
    """BRD: GET /api/v1/applications/{id}/status."""
    app = APPLICATIONS.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("/{job_id}", response_model=List[ApplicationResponse])
def list_applications(job_id: str):
    """List applications for a job (recruiter)."""
    if APPLICATIONS:
        return [a for a in APPLICATIONS.values() if a.get("job_id") == job_id]
    return [
        {"id": "101", "job_id": job_id, "name": "Alice Smith", "email": "a@b.com", "phone": "123", "resume_text": "text", "status": "interview_scheduled", "match_score": 82.0, "parsed_data": None, "interview_id": "inv-1"},
        {"id": "102", "job_id": job_id, "name": "Bob Jones", "email": "b@b.com", "phone": "123", "resume_text": "text", "status": "pending_review", "match_score": 45.0, "parsed_data": None, "interview_id": None},
    ]
