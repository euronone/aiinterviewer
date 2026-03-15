"""
BRD-aligned API tests. Run with: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_list_jobs():
    r = client.get("/api/v1/jobs/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        assert "id" in data[0]
        assert "title" in data[0]
        assert "description" in data[0]


def test_create_job():
    r = client.post(
        "/api/v1/jobs/",
        json={
            "title": "Test Engineer",
            "description": "Test job",
            "requirements": ["Python", "pytest"],
            "department": "Engineering",
        },
    )
    assert r.status_code == 200
    j = r.json()
    assert j["title"] == "Test Engineer"
    assert "id" in j


def test_apply_and_status():
    # Ensure we have a job
    jobs = client.get("/api/v1/jobs/").json()
    assert jobs, "Need at least one job"
    job_id = jobs[0]["id"]

    r = client.post(
        "/api/v1/applications/",
        json={
            "job_id": job_id,
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+1234567890",
            "resume_text": "Python FastAPI React 5 years experience.",
        },
    )
    assert r.status_code == 200
    app_data = r.json()
    assert app_data["name"] == "Test User"
    assert "id" in app_data
    assert "status" in app_data
    assert "match_score" in app_data

    # BRD: GET application status
    aid = app_data["id"]
    r2 = client.get(f"/api/v1/applications/status/{aid}")
    assert r2.status_code == 200
    assert r2.json()["id"] == aid


def test_schedule_slots_and_book():
    jobs = client.get("/api/v1/jobs/").json()
    job_id = jobs[0]["id"]
    apply_r = client.post(
        "/api/v1/applications/",
        json={
            "job_id": job_id,
            "name": "Schedule Test",
            "email": "sched@example.com",
            "phone": "0",
            "resume_text": "Resume text",
        },
    )
    application_id = apply_r.json()["id"]

    r = client.get("/api/v1/schedule/slots")
    assert r.status_code == 200
    slots = r.json()
    assert isinstance(slots, list)
    if not slots:
        pytest.skip("No slots")
    slot_id = slots[0]["slot_id"]

    book_r = client.post(
        "/api/v1/schedule/book",
        json={"application_id": application_id, "slot_id": slot_id},
    )
    assert book_r.status_code == 200
    b = book_r.json()
    assert "interview_id" in b
    assert "unique_link" in b
    assert "/room/" in b["unique_link"] or "room" in b["unique_link"]


def test_assessment_by_interview():
    # Assessment placeholder when no interview done yet
    r = client.get("/api/v1/assessments/interview/some-fake-id")
    assert r.status_code == 200
    a = r.json()
    assert "feedback" in a or "id" in a
