from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import jobs, applications, assessments, schedule, interview_ws
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3004", "http://localhost:3006", "http://127.0.0.1:3006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# BRD API prefix /api/v1
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])
app.include_router(assessments.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(schedule.router, prefix="/api/v1/schedule", tags=["Schedule"])
app.include_router(interview_ws.router, prefix="/ws/v1/interview", tags=["Interview"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


@app.get("/health")
def health():
    return {"status": "ok"}
