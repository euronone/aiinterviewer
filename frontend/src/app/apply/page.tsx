"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { listJobs } from "@/services/api";
import type { Job } from "@/services/api";
import { ArrowRight } from "lucide-react";

export default function ApplyPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Apply for a Job</h1>
        <p className="text-muted-foreground mb-8">
          Choose a role below and submit your details and resume. Our AI will match you to the job and invite you to an interview if you qualify.
        </p>
        {loading && <p className="text-muted-foreground">Loading jobs...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border bg-card p-6 shadow-sm flex flex-col"
              >
                <h2 className="text-xl font-semibold">{job.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{job.department}</p>
                <p className="text-sm mt-2 line-clamp-2">{job.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.requirements.slice(0, 3).map((r) => (
                    <span key={r} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                      {r}
                    </span>
                  ))}
                </div>
                <Link href={`/apply/${job.id}`} className="mt-auto pt-4">
                  <Button className="w-full gap-2">
                    Apply <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && jobs.length === 0 && (
          <p className="text-muted-foreground">No jobs available at the moment.</p>
        )}
      </main>
    </div>
  );
}
