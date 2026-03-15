from fastapi import APIRouter, HTTPException
from app.schemas.schemas import AssessmentCreate, AssessmentResponse
from typing import Dict
import uuid

router = APIRouter()

# In-memory store: interview_id -> assessment (BRD: recruiter fetches scorecard by interview_id)
ASSESSMENTS_BY_INTERVIEW: Dict[str, dict] = {}


@router.post("/{application_id}", response_model=AssessmentResponse)
def generate_assessment(application_id: str, assessment: AssessmentCreate):
    """Store AI assessment (e.g. after interview ends)."""
    aid = str(uuid.uuid4())
    payload = {"id": aid, **assessment.model_dump()}
    return payload


@router.get("/interview/{interview_id}", response_model=AssessmentResponse)
def get_assessment_by_interview(interview_id: str):
    """BRD: GET /api/v1/assessments/{interview_id} - Fetch detailed scorecard for recruiter."""
    a = ASSESSMENTS_BY_INTERVIEW.get(interview_id)
    if not a:
        # Return placeholder for recruiter UI when assessment not yet generated
        return AssessmentResponse(
            id="pending",
            application_id="",
            behavioral_score=None,
            technical_score=None,
            core_skills_score=None,
            overall_score=None,
            feedback="Assessment will be available after the interview is completed.",
        )
    return a


@router.post("/interview/{interview_id}", response_model=AssessmentResponse)
def save_assessment_for_interview(interview_id: str, assessment: AssessmentCreate):
    """Save assessment linked to interview (called when interview ends)."""
    aid = str(uuid.uuid4())
    payload = {"id": aid, **assessment.model_dump()}
    ASSESSMENTS_BY_INTERVIEW[interview_id] = payload
    return payload
