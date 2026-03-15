"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { getAssessmentByInterview } from "@/services/api";
import type { Assessment } from "@/services/api";
import { FileText } from "lucide-react";

export default function AssessmentPage() {
  const params = useParams();
  const interviewId = params.interviewId as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssessmentByInterview(interviewId)
      .then(setAssessment)
      .catch(() => setAssessment(null))
      .finally(() => setLoading(false));
  }, [interviewId]);

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <Link href="/recruiter" className="text-sm text-muted-foreground hover:underline">← Jobs</Link>
          <h1 className="text-xl font-semibold ml-4">AI Assessment</h1>
        </div>
        <div className="p-8 max-w-2xl">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && assessment && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Scorecard</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {assessment.behavioral_score != null && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Behavioral</div>
                    <div className="text-2xl font-bold">{assessment.behavioral_score}</div>
                  </div>
                )}
                {assessment.technical_score != null && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Technical</div>
                    <div className="text-2xl font-bold">{assessment.technical_score}</div>
                  </div>
                )}
                {assessment.core_skills_score != null && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Core Skills</div>
                    <div className="text-2xl font-bold">{assessment.core_skills_score}</div>
                  </div>
                )}
                {assessment.overall_score != null && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Overall</div>
                    <div className="text-2xl font-bold">{assessment.overall_score}</div>
                  </div>
                )}
              </div>
              {assessment.feedback && (
                <div className="pt-2">
                  <div className="text-sm font-medium text-muted-foreground">Feedback</div>
                  <p className="mt-1">{assessment.feedback}</p>
                </div>
              )}
            </div>
          )}
          {!loading && !assessment && <p className="text-muted-foreground">Assessment not found.</p>}
          <div className="mt-6">
            <Link href="/recruiter"><Button variant="outline">Back to Jobs</Button></Link>
          </div>
        </div>
      </main>
    </div>
  );
}
