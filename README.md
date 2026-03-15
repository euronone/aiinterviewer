# AI Interviewer & Skill Assessment Platform

End-to-end automated recruitment platform: candidate onboarding, resume parsing, JD matching, interview scheduling, and multi-round AI video/voice interviews with assessments.

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI
- **Database:** Supabase (PostgreSQL) optional; in-memory fallback for demo

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set .env from .env.example (SUPABASE_*, OPENAI_API_KEY optional)
$env:PYTHONPATH = (Get-Location).Path
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local   # optional: set NEXT_PUBLIC_API_URL if backend not on 8000
npm install
npm run dev
```

Open http://localhost:3000 (or the port shown). Apply for a job, schedule an interview, join the room.

## Tests

```bash
cd backend && $env:PYTHONPATH=(Get-Location).Path && python -m pytest tests/test_api.py -v
```

## Docs

- [BRD.md](BRD.md) – Business requirements
- [ROUTES.md](ROUTES.md) – All frontend and API routes
- [RUN_TESTS.md](RUN_TESTS.md) – How to run tests
