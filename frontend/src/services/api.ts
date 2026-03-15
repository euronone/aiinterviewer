/**
 * API client for BRD backend (FastAPI /api/v1).
 */
const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
const WS_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000")
  : "ws://localhost:8000";

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  department: string;
}

export interface Application {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  resume_text: string;
  status: string;
  match_score?: number;
  parsed_data?: Record<string, unknown>;
  interview_id?: string | null;
}

export interface Slot {
  slot_id: string;
  start: string;
  end: string;
  date: string;
}

export interface BookSlotResponse {
  interview_id: string;
  unique_link: string;
  scheduled_at: string;
}

export interface Assessment {
  id: string;
  application_id: string;
  behavioral_score?: number | null;
  technical_score?: number | null;
  core_skills_score?: number | null;
  overall_score?: number | null;
  feedback?: string | null;
}

export async function listJobs(): Promise<Job[]> {
  const r = await fetch(`${API_BASE}/api/v1/jobs/`);
  if (!r.ok) throw new Error("Failed to fetch jobs");
  return r.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const r = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
  if (!r.ok) throw new Error("Failed to fetch job");
  return r.json();
}

export async function applyJob(data: {
  job_id: string;
  name: string;
  email: string;
  phone: string;
  resume_text: string;
}): Promise<Application> {
  const r = await fetch(`${API_BASE}/api/v1/applications/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed to apply");
  return r.json();
}

export async function getApplicationStatus(applicationId: string): Promise<Application> {
  const r = await fetch(`${API_BASE}/api/v1/applications/status/${applicationId}`);
  if (!r.ok) throw new Error("Failed to fetch application status");
  return r.json();
}

export async function getSlots(): Promise<Slot[]> {
  const r = await fetch(`${API_BASE}/api/v1/schedule/slots`);
  if (!r.ok) throw new Error("Failed to fetch slots");
  return r.json();
}

export async function bookSlot(applicationId: string, slotId: string): Promise<BookSlotResponse> {
  const r = await fetch(`${API_BASE}/api/v1/schedule/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: applicationId, slot_id: slotId }),
  });
  if (!r.ok) throw new Error("Failed to book slot");
  return r.json();
}

export async function getAssessmentByInterview(interviewId: string): Promise<Assessment> {
  const r = await fetch(`${API_BASE}/api/v1/assessments/interview/${interviewId}`);
  if (!r.ok) throw new Error("Failed to fetch assessment");
  return r.json();
}

export function getInterviewWebSocketUrl(interviewId: string): string {
  return `${WS_BASE}/ws/v1/interview/${interviewId}`;
}

export async function listApplicationsByJob(jobId: string): Promise<Application[]> {
  const r = await fetch(`${API_BASE}/api/v1/applications/${jobId}`);
  if (!r.ok) throw new Error("Failed to fetch applications");
  return r.json();
}

export async function createJob(data: {
  title: string;
  description: string;
  requirements: string[];
  department: string;
}): Promise<Job> {
  const r = await fetch(`${API_BASE}/api/v1/jobs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("Failed to create job");
  return r.json();
}
