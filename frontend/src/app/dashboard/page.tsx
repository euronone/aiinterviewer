import { CandidateNav } from "@/components/candidate/CandidateNav";
import { Button } from "@/components/ui/button";
import { Calendar, Video, Clock, CheckCircle } from "lucide-react";

export default function CandidateDashboard() {
  return (
    <div className="flex min-h-screen">
      <CandidateNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <h1 className="text-xl font-semibold">My Applications</h1>
        </div>
        
        <div className="p-8">
          <div className="grid gap-6">
            {/* Application Card 1 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">Senior Frontend Engineer</h3>
                    <p className="text-sm text-muted-foreground mt-2">TechCorp Inc. • Applied on Oct 24, 2024</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold text-yellow-600 bg-yellow-50 border-yellow-200">
                    <Clock className="h-4 w-4" />
                    Interview Pending
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="rounded-lg border bg-muted/50 p-6 mb-6">
                  <h4 className="font-semibold mb-4 text-lg">Next Step: Technical Interview</h4>
                  <p className="text-muted-foreground mb-6">
                    Congratulations! Your resume has been shortlisted. Please schedule your AI technical interview within the next 48 hours.
                  </p>
                  <div className="flex gap-4">
                    <Button className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule Interview
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Video className="h-4 w-4" />
                      Test Equipment
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <h4 className="font-semibold">Interview Process</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="h-4 w-4" /> Resume Screening
                    </div>
                    <div className="h-px flex-1 bg-border"></div>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <div className="h-4 w-4 rounded-full border-2 border-primary"></div> Technical Interview
                    </div>
                    <div className="h-px flex-1 bg-border"></div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground"></div> HR Round
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Card 2 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm opacity-75">
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">Full Stack Developer</h3>
                    <p className="text-sm text-muted-foreground mt-2">StartupCo • Applied on Oct 15, 2024</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold text-green-600 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4" />
                    Offer Extended
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Button variant="outline" className="w-full">View Offer Details</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
