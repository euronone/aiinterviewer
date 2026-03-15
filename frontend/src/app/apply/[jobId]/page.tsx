"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { getJob, applyJob } from "@/services/api";
import type { Job } from "@/services/api";

export default function ApplyFormPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", resume_text: "" });

  useEffect(() => {
    getJob(jobId)
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const app = await applyJob({
        job_id: jobId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        resume_text: form.resume_text || "Resume content provided by candidate.",
      });
      router.push(`/apply/success?applicationId=${app.id}&status=${app.status}&match_score=${app.match_score ?? ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, resume_text: (reader.result as string) || "" }));
    reader.readAsText(file);
  };

  if (loading || !job) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {loading ? <p>Loading...</p> : <p className="text-destructive">{error || "Job not found"}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/apply" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
          ← Back to jobs
        </Link>
        <h1 className="text-2xl font-bold">Apply for {job.title}</h1>
        <p className="text-muted-foreground mb-6">{job.department}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resume (paste text or upload .txt)</label>
            <input type="file" accept=".txt,.md" onChange={handleFileChange} className="mb-2 block text-sm" />
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
              placeholder="Paste resume content or upload a file..."
              value={form.resume_text}
              onChange={(e) => setForm((f) => ({ ...f, resume_text: e.target.value }))}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </main>
    </div>
  );
}
