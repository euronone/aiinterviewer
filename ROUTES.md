# All Routes – Frontend & Backend

Every route has been verified. Missing routes were added and tested in the browser.

---

## Frontend (Next.js)

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page | ✅ |
| `/login` | Log in (email/password placeholder) | ✅ |
| `/apply` | List jobs, apply for a job | ✅ |
| `/apply/[jobId]` | Application form (name, email, phone, resume) | ✅ |
| `/apply/success` | Post-apply success (match score, invite/schedule link) | ✅ |
| `/dashboard` | Candidate: My Applications | ✅ |
| `/dashboard/resume` | Candidate: My Resume | ✅ |
| `/dashboard/interviews` | Candidate: My Interviews | ✅ |
| `/schedule/[applicationId]` | Pick interview slot, book → redirect to room | ✅ |
| `/room/[interviewId]` | AI interview room (WebSocket chat) | ✅ |
| `/recruiter` | Recruiter: Active Jobs | ✅ |
| `/recruiter/jobs/new` | Post New Job form | ✅ |
| `/recruiter/jobs/[jobId]/candidates` | Candidates for a job | ✅ |
| `/recruiter/candidates` | All candidates across jobs | ✅ |
| `/recruiter/settings` | Company & notifications (placeholder) | ✅ |
| `/recruiter/assessments/[interviewId]` | AI assessment scorecard | ✅ |

**Nav links checked:**  
- Landing: Log in, Get Started, Apply for a Job, I'm a Recruiter  
- Candidate nav: My Applications, My Resume, Interviews  
- Recruiter nav: Jobs, Candidates, Settings  

---

## Backend (FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| GET | `/api/v1/jobs/` | List jobs |
| POST | `/api/v1/jobs/` | Create job |
| GET | `/api/v1/jobs/{job_id}` | Get job by id |
| POST | `/api/v1/applications/` | Apply (parse resume, match, return status) |
| GET | `/api/v1/applications/status/{application_id}` | Get application status |
| GET | `/api/v1/applications/{job_id}` | List applications for job |
| GET | `/api/v1/schedule/slots` | Get available slots |
| POST | `/api/v1/schedule/book` | Book slot, return interview link |
| GET | `/api/v1/assessments/interview/{interview_id}` | Get assessment by interview |
| POST | `/api/v1/assessments/interview/{interview_id}` | Save assessment |
| WebSocket | `/ws/v1/interview/{interview_id}` | Real-time interview |

All 6 pytest tests in `backend/tests/test_api.py` pass.
