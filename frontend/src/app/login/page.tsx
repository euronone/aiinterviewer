import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-2">Log in</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Sign in to your candidate or recruiter account.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full">Log in</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <Link href="/apply" className="text-primary hover:underline">Apply as candidate</Link>
            {" or "}
            <Link href="/recruiter" className="text-primary hover:underline">Go to recruiter</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
