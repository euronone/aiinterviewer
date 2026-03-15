"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { listJobs, listApplicationsByJob } from "@/services/api";
import type { Job, Application } from "@/services/api";
import { PlusCircle, Search, MoreHorizontal } from "lucide-react";

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, Application[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listJobs()
      .then((j) => {
        setJobs(j);
        return Promise.all(j.map((job) => listApplicationsByJob(job.id).then((apps) => ({ jobId: job.id, apps }))));
      })
      .then((results) => {
        const map: Record<string, Application[]> = {};
        results.forEach(({ jobId, apps }) => { map[jobId] = apps; });
        setApplicationsByJob(map);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(
    (j) => !search || j.title.toLowerCase().includes(search.toLowerCase())
  );

  const stats = (jobId: string) => {
    const apps = applicationsByJob[jobId] || [];
    const total = apps.length;
    const interviewed = apps.filter((a) => a.interview_id).length;
    const invited = apps.filter((a) => a.status === "invited" || a.status === "interview_scheduled").length;
    return { total, interviewed, invited };
  };

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center justify-between border-b bg-background px-8">
          <h1 className="text-xl font-semibold">Active Jobs</h1>
          <Link href="/recruiter/jobs/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Post New Job
            </Button>
          </Link>
        </div>
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search jobs..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <p className="text-muted-foreground">Loading jobs...</p>}
          <div className="grid gap-6">
            {!loading && filtered.map((job) => {
              const { total, interviewed } = stats(job.id);
              return (
                <div key={job.id} className="rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">{job.title}</h3>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/recruiter/jobs/${job.id}/candidates`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{job.department}</p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="text-sm font-medium text-muted-foreground">Total Applicants</div>
                        <div className="text-2xl font-bold">{total}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="text-sm font-medium text-muted-foreground">AI Interviews</div>
                        <div className="text-2xl font-bold text-primary">{interviewed}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/recruiter/jobs/${job.id}/candidates`} className="w-full">
                        <Button variant="outline" className="w-full">View Candidates</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!loading && filtered.length === 0 && (
            <p className="text-muted-foreground">No jobs yet. Post a new job to get started.</p>
          )}
        </div>
      </main>
    </div>
  );
}
