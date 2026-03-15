import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for modern recruitment. © 2024 AI Interviewer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
