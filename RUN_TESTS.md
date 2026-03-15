# Running Tests (BRD – Auto Mode)

See **FEATURE_CHECKLIST.md** for a full BRD feature-by-feature verification status.

## Backend API tests (pytest)

From project root:

```powershell
cd backend
$env:PYTHONPATH = (Get-Location).Path
python -m pytest tests/test_api.py -v
```

All 6 BRD-aligned tests must pass:

- `test_root` – Health
- `test_list_jobs` – List jobs
- `test_create_job` – Create job (recruiter)
- `test_apply_and_status` – Apply + GET application status
- `test_schedule_slots_and_book` – Get slots, book slot, get interview link
- `test_assessment_by_interview` – GET assessment by interview id

## Full stack E2E (auto mode with agent)

1. **Start backend** (terminal 1):

   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

   If port 8000 is in use, use another port (e.g. 9000) and set frontend env (step 3).

2. **Start frontend** (terminal 2):

   ```powershell
   cd frontend
   npm run dev
   ```

   If port 3000 is in use, Next.js will use the next available port (e.g. 3004).

3. **Optional – different backend port**

   If the backend runs on a different port (e.g. 9000), create `frontend/.env.local`:

   ```
   NEXT_PUBLIC_API_URL=http://localhost:9000
   NEXT_PUBLIC_WS_URL=ws://localhost:9000
   ```

   Restart the frontend after changing env.

4. **Manual E2E in browser**

   - **Candidate:** Open `/apply` → pick a job → fill form (name, email, phone, resume text) → submit. If status is “invited”, click “Schedule Interview” → pick slot → confirm redirect to `/room/[id]`. In the room, send a message and confirm AI reply.
   - **Recruiter:** Open `/recruiter` → confirm jobs from API → “Post New Job” → fill and submit → “View Candidates” on a job → “View Assessment” if available.

5. **Automated E2E (agent)**

   Use an agent (e.g. Cursor task with browser MCP or Playwright) to run the same flows. Backend API tests above already validate apply, status, slots, book, and assessment endpoints.
