"""
HireAI — AI Interviewer Platform
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.endpoints import (
    jobs, applications, schedule, interview_ws, assessment, auth
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    await init_db()
    print("Database initialized")
    print("HireAI Backend started")
    yield
    print("HireAI Backend shutting down")


app = FastAPI(
    title="HireAI API",
    description="AI-Powered Interview & Skill Assessment Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["Applications"])
app.include_router(schedule.router, prefix="/api/v1/schedule", tags=["Scheduling"])
app.include_router(assessment.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(interview_ws.router, prefix="/ws/v1", tags=["Interview WebSocket"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "HireAI API",
        "version": "1.0.0",
    }
