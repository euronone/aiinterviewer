"""
WebSocket endpoint for real-time AI interview (BRD: /ws/v1/interview/{interview_id}).
Simulates multi-round state (intro -> technical -> hr -> salary) and echo/LLM-style responses for testing.
"""

import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

ROUNDS = ["intro", "technical", "hr", "salary"]
# Import in endpoint to avoid circular import
def _get_interview(interview_id: str):
    from app.api.endpoints.schedule import get_interview
    return get_interview(interview_id)


@router.websocket("/{interview_id}")
async def interview_websocket(websocket: WebSocket, interview_id: str):
    await websocket.accept()
    state = {"round_index": 0, "transcript": []}
    try:
        # Send welcome / round start
        round_name = ROUNDS[state["round_index"]]
        await websocket.send_json({
            "type": "agent_response",
            "text": f"Welcome to the AI interview. We're starting with the {round_name} round. Please introduce yourself.",
        })
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data) if data.strip().startswith("{") else {"type": "user_input", "text": data}
            user_text = msg.get("text", msg.get("content", ""))
            if not user_text:
                continue
            state["transcript"].append({"role": "user", "content": user_text})
            # Simulate AI reply (echo + round progression for testing)
            if "next" in user_text.lower() or "done" in user_text.lower():
                state["round_index"] = min(state["round_index"] + 1, len(ROUNDS) - 1)
                round_name = ROUNDS[state["round_index"]]
                reply = f"Moving to {round_name} round. Tell me more."
            else:
                reply = f"Thanks for that. (Round: {round_name})"
            state["transcript"].append({"role": "assistant", "content": reply})
            await websocket.send_json({"type": "agent_response", "text": reply})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "text": str(e)})
        except Exception:
            pass
