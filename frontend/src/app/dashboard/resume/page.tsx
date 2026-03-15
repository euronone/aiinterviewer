import { CandidateNav } from "@/components/candidate/CandidateNav";
import { FileText, Upload } from "lucide-react";

export default function MyResumePage() {
  return (
    <div className="flex min-h-screen">
      <CandidateNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <h1 className="text-xl font-semibold">My Resume</h1>
        </div>
        <div className="p-8 max-w-2xl">
          <div className="rounded-xl border bg-card p-8 text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Manage your resume</h2>
            <p className="text-muted-foreground mb-6">
              Your resume is used when you apply for jobs. You can update it from the application form each time you apply, or paste it here to keep a copy for reference.
            </p>
            <div className="rounded-lg border border-dashed bg-muted/30 p-8">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Paste or upload your resume when you apply for a job</p>
              <p className="text-xs text-muted-foreground mt-1">Go to Apply for a Job to submit an application with your latest resume.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
