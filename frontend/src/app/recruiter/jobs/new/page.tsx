"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { createJob } from "@/services/api";

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "Engineering",
    requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const requirements = form.requirements.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await createJob({
        title: form.title,
        description: form.description,
        department: form.department,
        requirements: requirements.length ? requirements : ["General"],
      });
      router.push("/recruiter");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <h1 className="text-xl font-semibold">Post New Job</h1>
        </div>
        <div className="p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Requirements (comma-separated)</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Python, FastAPI, React"
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Job"}</Button>
              <Link href="/recruiter"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
