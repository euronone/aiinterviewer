import Link from "next/link";
import { DashboardNav } from "@/components/recruiter/DashboardNav";
import { Button } from "@/components/ui/button";
import { Building, Bell } from "lucide-react";

export default function RecruiterSettingsPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="flex h-16 items-center border-b bg-background px-8">
          <Link href="/recruiter" className="text-sm text-muted-foreground hover:underline">← Jobs</Link>
          <h1 className="text-xl font-semibold ml-4">Settings</h1>
        </div>
        <div className="p-8 max-w-2xl">
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Building className="h-4 w-4" />
                Company
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Company profile and branding (coming soon).
              </p>
              <Button variant="outline" size="sm" disabled>Edit</Button>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4" />
                Notifications
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Email and in-app notification preferences (coming soon).
              </p>
              <Button variant="outline" size="sm" disabled>Edit</Button>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/recruiter">
              <Button variant="outline">Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
