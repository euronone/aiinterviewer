import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video, FileText, CheckCircle, Clock } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The Future of <span className="text-primary">Technical Interviews</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed">
              Automate your hiring process with our AI-powered voice and video interviewer. Assess skills, behavior, and cultural fit in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <Link href="/apply" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2">
                Apply for a Job <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/recruiter" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full">
                I&apos;m a Recruiter
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 md:pt-16 max-w-4xl w-full">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background shadow-sm border">
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-sm">Resume Parsing</h3>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background shadow-sm border">
              <Video className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-sm">Video & Voice</h3>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background shadow-sm border">
              <Clock className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-sm">Auto Scheduling</h3>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background shadow-sm border">
              <CheckCircle className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-sm">Smart Assessment</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
