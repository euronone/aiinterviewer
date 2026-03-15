"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { listJobs, listApplicationsByJob } from "@/services/api";
import type { Job, Application } from "@/services/api";
import { Users, Briefcase } from "lucide-react";

export default function AllCandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, Application[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then((j) => {
        setJobs(j);
        return Promise.all(
          j.map((job) =>
            listApplicationsByJob(job.id).then((apps) => ({ jobId: job.id, apps }))
          )
        );
      })
      .then((results) => {
        const map: Record<string, Application[]> = {};
        results.forEach(({ jobId, apps }) => {
          map[jobId] = apps;
        });
        setApplicationsByJob(map);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  type AppWithJob = Application & { jobTitle: string };
  const allCandidates: AppWithJob[] = jobs.flatMap((job) =>
    (applicationsByJob[job.id] || []).map((app) => ({ ...app, jobTitle: job.title }))
  );

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <Link href="/recruiter" className="text-sm text-muted-foreground hover:underline">← Jobs</Link>
          <h1 className="text-xl font-semibold ml-4">All Candidates</h1>
        </div>
        <div className="p-8">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && (
            <div className="space-y-4">
              {allCandidates.length === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No candidates yet.</p>
                  <Link href="/recruiter">
                    <Button variant="outline" className="mt-4">Back to Jobs</Button>
                  </Link>
                </div>
              ) : (
                allCandidates.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border bg-card p-6 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold">{app.name}</h3>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                      <p className="text-xs mt-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {app.jobTitle} · Match: {app.match_score != null ? `${app.match_score}%` : "—"} · {app.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/recruiter/jobs/${app.job_id}/candidates`}>
                        <Button variant="outline" size="sm">View job candidates</Button>
                      </Link>
                      {app.interview_id && (
                        <Link href={`/recruiter/assessments/${app.interview_id}`}>
                          <Button variant="default" size="sm">View Assessment</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
