import Link from "next/link";
import { CandidateNav } from "@/components/candidate/CandidateNav";
import { Button } from "@/components/ui/button";
import { Video, CheckCircle } from "lucide-react";

export default function InterviewsPage() {
  return (
    <div className="flex min-h-screen">
      <CandidateNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <h1 className="text-xl font-semibold">My Interviews</h1>
        </div>
        <div className="p-8">
          <div className="rounded-xl border bg-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming & past interviews
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              When you schedule an interview from an application, it will appear here. Join via the link sent to you or from your application card.
            </p>
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming interviews</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule an interview from My Applications when you receive an invite.</p>
              <Link href="/dashboard">
                <Button variant="outline" className="mt-4">Go to My Applications</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
