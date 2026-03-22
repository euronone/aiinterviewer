"""Scheduling endpoints — slot listing and booking."""
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, HTTPException, Body
from app.core.database import get_supabase
from app.schemas.schemas import TimeSlot, BookSlotRequest, ScheduleResponse
from app.services.email_service import send_calendar_invite

router = APIRouter()


def generate_slots(days_ahead: int = 7) -> List[TimeSlot]:
    """Generate available 45-min interview slots for the next N days (9 AM – 6 PM IST)."""
    slots = []
    now = datetime.utcnow()
    
    for day_offset in range(1, days_ahead + 1):
        day = now + timedelta(days=day_offset)
        if day.weekday() >= 5:  # Skip weekends
            continue
        
        for hour in range(9, 18):  # 9 AM to 5 PM
            for minute in [0, 30]:  # Every 30 mins
                start = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
                slots.append(TimeSlot(
                    slot_id=f"{start.strftime('%Y%m%d-%H%M')}",
                    start_time=start,
                    end_time=start + timedelta(minutes=45),
                    available=True,
                ))
    
    return slots[:20]  # Return first 20 slots


@router.get("/slots", response_model=List[TimeSlot])
async def get_available_slots(application_id: str):
    """Get available interview time slots."""
    supabase = get_supabase()
    
    # Verify application exists
    app = supabase.table("applications").select("id, status").eq("id", application_id).execute()
    if not app.data:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    # Get already-booked slots to exclude
    booked = supabase.table("interviews").select("scheduled_at").eq("status", "scheduled").execute()
    booked_times = {row["scheduled_at"] for row in (booked.data or [])}
    
    slots = generate_slots()
    for slot in slots:
        if slot.start_time.isoformat() in booked_times:
            slot.available = False
    
    return [s for s in slots if s.available]


@router.post("/book", response_model=ScheduleResponse)
async def book_slot(data: BookSlotRequest):
    """Book an interview slot."""
    supabase = get_supabase()
    
    # Get application and job info for the invite
    app_result = supabase.table("applications").select(
        "*, jobs(title), users(name, email)"
    ).eq("id", data.application_id).single().execute()
    
    if not app_result.data:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    application = app_result.data
    
    # Parse slot time from slot_id (format: YYYYMMDD-HHMM)
    try:
        scheduled_at = datetime.strptime(data.slot_id, "%Y%m%d-%H%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid slot ID format.")
    
    # Create interview record
    interview_id = str(uuid.uuid4())
    unique_token = str(uuid.uuid4()).replace("-", "")
    interview_link = f"/candidate/room/{interview_id}?token={unique_token}"
    
    supabase.table("interviews").insert({
        "id": interview_id,
        "application_id": data.application_id,
        "scheduled_at": scheduled_at.isoformat(),
        "status": "scheduled",
        "unique_link": unique_token, # Using unique_token string here as the 'link' identifier
    }).execute()
    
    # Update application status
    supabase.table("applications").update({"status": "scheduled"}).eq("id", data.application_id).execute()
    
    # Send calendar invite
    candidate = application.get("users", {})
    await send_calendar_invite(
        to_email=candidate.get("email", ""),
        candidate_name=candidate.get("name", ""),
        job_title=application.get("jobs", {}).get("title", ""),
        scheduled_at=scheduled_at,
        interview_link=interview_link,
    )
    
    return ScheduleResponse(
        interview_id=interview_id,
        scheduled_at=scheduled_at,
        unique_link=interview_link,
        calendar_invite_sent=True,
    )
