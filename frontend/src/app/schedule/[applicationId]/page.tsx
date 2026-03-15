"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { getSlots, bookSlot } from "@/services/api";
import type { Slot } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSlots()
      .then(setSlots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async (slotId: string) => {
    setBooking(slotId);
    setError(null);
    try {
      const result = await bookSlot(applicationId, slotId);
      router.push(`/room/${result.interview_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(null);
    }
  };

  const byDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    const d = s.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Schedule Your Interview</h1>
        <p className="text-muted-foreground mb-6">
          Choose an available slot. You will be redirected to the interview room after booking.
        </p>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading slots...
          </div>
        )}
        {error && <p className="text-destructive mb-4">{error}</p>}
        {!loading && Object.keys(byDate).length > 0 && (
          <div className="space-y-6">
            {Object.entries(byDate).slice(0, 7).map(([date, daySlots]) => (
              <div key={date}>
                <h2 className="font-semibold mb-2">{date}</h2>
                <div className="flex flex-wrap gap-2">
                  {daySlots.slice(0, 8).map((slot) => (
                    <Button
                      key={slot.slot_id}
                      variant="outline"
                      size="sm"
                      disabled={booking !== null}
                      onClick={() => handleBook(slot.slot_id)}
                    >
                      {booking === slot.slot_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        slot.start.slice(11, 16)
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && slots.length === 0 && !error && <p className="text-muted-foreground">No slots available.</p>}
        <div className="mt-8">
          <Link href="/dashboard">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
