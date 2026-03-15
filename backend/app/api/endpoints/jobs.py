from fastapi import APIRouter, HTTPException
from app.schemas.schemas import JobCreate, JobResponse
from typing import List
from app.db.supabase import supabase
from app.core.config import settings
import uuid

router = APIRouter()

# Mock data for skeleton when real Supabase is not configured
MOCK_JOBS = [
    {
        "id": "1",
        "title": "Senior Software Engineer",
        "description": "Looking for a python dev",
        "requirements": ["Python", "FastAPI"],
        "department": "Engineering"
    }
]

def is_supabase_configured():
    return settings.SUPABASE_URL != "http://localhost:8000" and settings.SUPABASE_KEY != "dummy_key"

@router.post("/", response_model=JobResponse)
def create_job(job: JobCreate):
    if not is_supabase_configured():
        # Fallback to mock data
        new_job = job.model_dump()
        new_job["id"] = str(uuid.uuid4())
        MOCK_JOBS.append(new_job)
        return new_job
        
    try:
        response = supabase.table("jobs").insert(job.model_dump()).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to create job")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[JobResponse])
def list_jobs():
    if not is_supabase_configured():
        return MOCK_JOBS
    try:
        response = supabase.table("jobs").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    if not is_supabase_configured():
        job = next((j for j in MOCK_JOBS if j["id"] == job_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    try:
        response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
