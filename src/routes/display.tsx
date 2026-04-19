import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LiveClock } from "@/components/LiveClock";
import { InfoSlideshow } from "@/components/InfoSlideshow";
import { CounterGrid } from "@/components/CounterGrid";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import { speakCall } from "@/lib/queue";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "Layar Display Antrian — Antrean Digital" },
      {
        name: "description",
        content:
          "Layar TV antrian real-time menampilkan nomor antrian aktif dan status semua loket.",
      },
    ],
  }),
  component: DisplayPage,
});

function DisplayPage() {
  const { counters, tickets, lastEvent } = useRealtimeQueue();
  const [bumpId, setBumpId] = useState<string | null>(null);
  const seenEvents = useRef<Set<string>>(new Set());

  // Derive most recent active ticket (called/serving)
  const activeCalled = useMemo(() => {
    const called = tickets
      .filter((t) => (t.status === "called" || t.status === "serving") && t.called_at)
      .sort((a, b) => (b.called_at! > a.called_at! ? 1 : -1));
    return called[0];
  }, [tickets]);

  const activeCounter = useMemo(
    () => counters.find((c) => c.id === activeCalled?.counter_id),
    [counters, activeCalled],
  );

  // Audio + highlight on every new call_event
  useEffect(() => {
    if (!lastEvent) return;
    if (seenEvents.current.has(lastEvent.id)) return;
    seenEvents.current.add(lastEvent.id);
    setBumpId(lastEvent.counter_id);
    speakCall(lastEvent.ticket_number, lastEvent.counter_number);
    const id = setTimeout(() => setBumpId(null), 2200);
    return () => clearTimeout(id);
  }, [lastEvent]);

  // Next-up queue (waiting)
  const upcoming = useMemo(
    () =>
      tickets
        .filter((t) => t.status === "waiting")
        .sort((a, b) => (a.issued_at < b.issued_at ? -1 : 1))
        .slice(0, 5),
    [tickets],
  );

  return (
    <div className="min-h-screen bg-hero text-foreground p-4 md:p-8 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 md:h-16 md:w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-glow text-navy-deep font-black text-2xl shadow-glow">
            AD
          </div>
          <div>
            <div className="font-display text-2xl md:text-3xl font-extrabold leading-tight">
              KECAMATAN GAYAMSARI
            </div>
            <div className="text-sm md:text-base text-muted-foreground tracking-widest uppercase">
              Pelayanan Antrian Digital
            </div>
          </div>
        </div>
        <LiveClock />
      </header>

      {/* Hero: active number + slideshow */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6 flex-1 min-h-0">
        {/* LEFT — Active queue */}
        <div className="lg:col-span-3 rounded-3xl bg-card-gradient ring-gold p-6 md:p-10 shadow-card-elev flex flex-col">
          <div className="flex items-center justify-between">
            <div className="text-sm md:text-base uppercase tracking-[0.3em] text-muted-foreground">
              Nomor Antrian
            </div>
            <div className="rounded-full border border-gold/40 bg-navy-deep/50 px-4 py-1.5 text-xs uppercase tracking-widest text-gold">
              ● Live
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {activeCalled ? (
              <>
                <div
                  key={activeCalled.id}
                  className="font-display tabular-nums font-black leading-none text-gold-gradient animate-ticker-pop"
                  style={{ fontSize: "clamp(8rem, 22vw, 22rem)" }}
                >
                  {activeCalled.ticket_number}
                </div>
                <div className="mt-4 text-2xl md:text-4xl text-muted-foreground">
                  silakan menuju
                </div>
                <div className="mt-2 font-display text-4xl md:text-7xl font-extrabold">
                  {activeCounter?.name ?? "—"}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div
                  className="font-display font-black leading-none text-foreground/20"
                  style={{ fontSize: "clamp(6rem, 16vw, 16rem)" }}
                >
                  —
                </div>
                <div className="mt-4 text-xl md:text-2xl text-muted-foreground">
                  Belum ada antrian dipanggil
                </div>
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Antrian Berikutnya
            </div>
            <div className="flex flex-wrap gap-2">
              {upcoming.length === 0 && (
                <span className="text-muted-foreground italic">
                  Tidak ada antrian menunggu
                </span>
              )}
              {upcoming.map((t) => (
                <span
                  key={t.id}
                  className="rounded-xl bg-navy-deep/60 px-4 py-2 font-display tabular-nums text-xl md:text-2xl font-bold text-foreground/80"
                >
                  {t.ticket_number}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Info slideshow */}
        <div className="lg:col-span-2 min-h-[280px] lg:min-h-0">
          <InfoSlideshow />
        </div>
      </section>

      {/* Footer: counters */}
      <footer className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Status Loket
        </div>
        <CounterGrid
          counters={counters}
          tickets={tickets}
          highlightCounterId={bumpId}
        />
      </footer>
    </div>
  );
}
