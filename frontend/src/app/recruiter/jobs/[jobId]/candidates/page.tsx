"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { listApplicationsByJob } from "@/services/api";
import type { Application } from "@/services/api";
import { Video } from "lucide-react";

export default function JobCandidatesPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listApplicationsByJob(jobId)
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <Link href="/recruiter" className="text-sm text-muted-foreground hover:underline">← Jobs</Link>
          <h1 className="text-xl font-semibold ml-4">Candidates</h1>
        </div>
        <div className="p-8">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="rounded-xl border bg-card p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-xs mt-1">
                      Match: {app.match_score != null ? `${app.match_score}%` : "—"} · Status: {app.status}
                    </p>
                  </div>
                  {app.interview_id && (
                    <Link href={`/recruiter/assessments/${app.interview_id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Video className="h-4 w-4" /> View Assessment
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
              {applications.length === 0 && <p className="text-muted-foreground">No candidates yet.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
