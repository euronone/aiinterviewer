from pydantic import BaseModel
from typing import List, Optional

class JobBase(BaseModel):
    title: str
    description: str
    requirements: List[str]
    department: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str

class ApplicationBase(BaseModel):
    job_id: str
    name: str
    email: str
    phone: str
    resume_text: str

class ApplicationCreate(ApplicationBase):
    pass

class AssessmentBase(BaseModel):
    application_id: str
    behavioral_score: Optional[int] = None
    technical_score: Optional[int] = None
    core_skills_score: Optional[int] = None
    overall_score: Optional[int] = None
    feedback: Optional[str] = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentResponse(AssessmentBase):
    id: str


class SlotResponse(BaseModel):
    slot_id: str
    start: str
    end: str
    date: str


class BookSlotRequest(BaseModel):
    application_id: str
    slot_id: str


class BookSlotResponse(BaseModel):
    interview_id: str
    unique_link: str
    scheduled_at: str


class InterviewState(BaseModel):
    round: str
    transcript: List[str] = []


class ApplicationResponse(ApplicationBase):
    id: str
    status: str
    match_score: Optional[float] = None
    parsed_data: Optional[dict] = None
    interview_id: Optional[str] = None
