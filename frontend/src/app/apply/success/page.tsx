"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar } from "lucide-react";

function ApplySuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const status = searchParams.get("status");
  const matchScore = searchParams.get("match_score");
  const invited = status === "invited";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-lg mx-auto">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Application Submitted</h1>
        <p className="text-muted-foreground mb-4">
          Your application has been received. We parsed your resume and compared it to the job description.
        </p>
        {matchScore && <p className="text-sm font-medium">Match score: {matchScore}%</p>}
        {invited ? (
          <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <p className="font-medium text-green-800 dark:text-green-200">You&apos;re invited to interview!</p>
            <p className="text-sm text-muted-foreground mt-1">Schedule your AI interview slot below.</p>
            <Link href={applicationId ? `/schedule/${applicationId}` : "/dashboard"}>
              <Button className="mt-4 gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Interview
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            Your application is under review. We&apos;ll contact you if you are shortlisted.
          </p>
        )}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/apply">
            <Button variant="outline">Apply for another job</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to home</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function SuccessFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto" />
          <div className="h-8 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
        </div>
      </main>
    </div>
  );
}

export default function ApplySuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <ApplySuccessContent />
    </Suspense>
  );
}
