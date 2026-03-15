import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Briefcase, Users, Settings, LogOut } from "lucide-react";

export function DashboardNav() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">AI Interviewer</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          <Link
            href="/recruiter"
            className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
          >
            <Briefcase className="h-4 w-4" />
            Jobs
          </Link>
          <Link
            href="/recruiter/candidates"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Users className="h-4 w-4" />
            Candidates
          </Link>
          <Link
            href="/recruiter/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
