from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta, timezone
from app.schemas.schemas import SlotResponse, BookSlotRequest, BookSlotResponse
from typing import Dict, List
import uuid

router = APIRouter()

# In-memory store for interviews (use DB in production)
INTERVIEWS: Dict[str, dict] = {}
AVAILABLE_SLOTS_CACHE: List[dict] = []


def _generate_slots(days_ahead: int = 14) -> List[dict]:
    slots = []
    base = datetime.now(timezone.utc).replace(hour=9, minute=0, second=0, microsecond=0)
    for d in range(days_ahead):
        day = base + timedelta(days=d)
        for hour in range(9, 17):
            start = day.replace(hour=hour, minute=0)
            end = start + timedelta(hours=1)
            slots.append({
                "slot_id": str(uuid.uuid4()),
                "start": start.isoformat() + "Z",
                "end": end.isoformat() + "Z",
                "date": day.strftime("%Y-%m-%d"),
            })
    return slots


@router.get("/slots", response_model=List[SlotResponse])
def get_slots():
    """Get available interview slots (BRD: calendar interface)."""
    global AVAILABLE_SLOTS_CACHE
    if not AVAILABLE_SLOTS_CACHE:
        AVAILABLE_SLOTS_CACHE = _generate_slots()
    return AVAILABLE_SLOTS_CACHE[:30]


@router.post("/book", response_model=BookSlotResponse)
def book_slot(body: BookSlotRequest):
    """Book a slot and return unique interview link (BRD: calendar invites)."""
    global AVAILABLE_SLOTS_CACHE
    if not AVAILABLE_SLOTS_CACHE:
        AVAILABLE_SLOTS_CACHE = _generate_slots()
    slot = next((s for s in AVAILABLE_SLOTS_CACHE if s["slot_id"] == body.slot_id), None)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    interview_id = str(uuid.uuid4())
    unique_link = f"/room/{interview_id}"
    INTERVIEWS[interview_id] = {
        "application_id": body.application_id,
        "scheduled_at": slot["start"],
        "status": "scheduled",
        "unique_link": unique_link,
    }
    # Link interview to application for status checks
    from app.api.endpoints.applications import APPLICATIONS
    if body.application_id in APPLICATIONS:
        APPLICATIONS[body.application_id]["interview_id"] = interview_id
        APPLICATIONS[body.application_id]["status"] = "interview_scheduled"
    return BookSlotResponse(
        interview_id=interview_id,
        unique_link=unique_link,
        scheduled_at=slot["start"],
    )


def get_interview(interview_id: str):
    """Return interview record or None."""
    return INTERVIEWS.get(interview_id)
