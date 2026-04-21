import { createFileRoute, Link } from "@tanstack/react-router";
import AppMark from "@/components/AppMark";
import { useMemo, useState } from "react";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import { callNext, recall, resetDaily, skip } from "@/lib/queue";
import { LiveClock } from "@/components/LiveClock";
import { CounterGrid } from "@/components/CounterGrid";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard Petugas — Antrean Digital" },
      {
        name: "description",
        content:
          "Dashboard petugas loket: panggil antrian berikutnya, ulangi panggilan, lewati antrian.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { counters, tickets, categories } = useRealtimeQueue();
  const [counterId, setCounterId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const counter = counters.find((c) => c.id === counterId);
  const currentTicket = useMemo(
    () => tickets.find((t) => t.id === counter?.current_ticket_id),
    [tickets, counter],
  );

  const waiting = useMemo(
    () => tickets.filter((t) => t.status === "waiting"),
    [tickets],
  );

  const stats = useMemo(() => {
    const total = tickets.length;
    const done = tickets.filter((t) => t.status === "done").length;
    const skipped = tickets.filter((t) => t.status === "skipped").length;
    return { total, done, skipped, waiting: waiting.length };
  }, [tickets, waiting]);

  const onCall = async () => {
    if (!counterId) return;
    setBusy(true);
    try {
      await callNext(counterId);
    } finally {
      setBusy(false);
    }
  };
  const onRecall = async () => {
    if (!counterId) return;
    setBusy(true);
    try {
      await recall(counterId);
    } finally {
      setBusy(false);
    }
  };
  const onSkip = async () => {
    if (!counterId) return;
    setBusy(true);
    try {
      await skip(counterId);
    } finally {
      setBusy(false);
    }
  };
  const onReset = async () => {
    if (!confirm("Reset semua antrian hari ini?")) return;
    await resetDaily();
  };

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Link to="/">
            <AppMark className="h-11 w-11 text-lg" />
          </Link>
          <div>
            <div className="font-display text-lg font-bold">Dashboard Petugas</div>
            <div className="text-xs text-muted-foreground -mt-0.5">
              Kelola antrian per loket
            </div>
          </div>
        </div>
        <LiveClock />
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 space-y-8">
        {/* Counter selector */}
        <section>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Pilih Loket Anda
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {counters.map((c) => {
              const active = counterId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCounterId(c.id)}
                  className={`rounded-xl px-4 py-4 font-display font-bold text-xl transition-all ${
                    active
                      ? "bg-gradient-to-br from-gold to-gold-glow text-navy-deep shadow-glow"
                      : "bg-card-gradient ring-gold text-foreground hover:-translate-y-0.5"
                  }`}
                >
                  Loket {c.number}
                </button>
              );
            })}
          </div>
        </section>

        {/* Active loket panel */}
        {counter && (
          <section className="rounded-3xl bg-card-gradient ring-gold p-6 md:p-10 shadow-card-elev">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Sedang Melayani
                </div>
                <div className="font-display text-2xl font-bold">{counter.name}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onCall}
                  disabled={busy}
                  className="rounded-xl bg-gradient-to-br from-gold to-gold-glow px-6 py-3 font-display text-base font-bold text-navy-deep shadow-glow disabled:opacity-50 hover:-translate-y-0.5 transition"
                >
                  Panggil Berikutnya →
                </button>
                <button
                  onClick={onRecall}
                  disabled={busy || !currentTicket}
                  className="rounded-xl bg-secondary px-5 py-3 font-display text-sm font-semibold text-foreground ring-gold disabled:opacity-40"
                >
                  Ulangi Panggilan
                </button>
                <button
                  onClick={onSkip}
                  disabled={busy || !currentTicket}
                  className="rounded-xl bg-destructive/20 border border-destructive/40 px-5 py-3 font-display text-sm font-semibold text-destructive disabled:opacity-40"
                >
                  Lewati
                </button>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6 items-center">
              <div className="text-center md:text-left">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Nomor Saat Ini
                </div>
                {currentTicket ? (
                  <div
                    key={currentTicket.id}
                    className="font-display font-black text-gold-gradient tabular-nums leading-none animate-ticker-pop"
                    style={{ fontSize: "clamp(5rem, 12vw, 11rem)" }}
                  >
                    {currentTicket.ticket_number}
                  </div>
                ) : (
                  <div
                    className="font-display font-black text-foreground/20 leading-none"
                    style={{ fontSize: "clamp(5rem, 12vw, 11rem)" }}
                  >
                    —
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Antrian Menunggu ({waiting.length})
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-auto">
                  {waiting.length === 0 && (
                    <span className="text-muted-foreground italic">
                      Tidak ada
                    </span>
                  )}
                  {waiting.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-lg bg-navy-deep/60 px-3 py-1.5 font-display tabular-nums text-base font-bold"
                    >
                      {t.ticket_number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Hari Ini" value={stats.total} />
          <StatCard label="Selesai" value={stats.done} accent="success" />
          <StatCard label="Menunggu" value={stats.waiting} accent="gold" />
          <StatCard label="Dilewati" value={stats.skipped} accent="warn" />
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Kategori Antrian
            </div>
            <button
              onClick={onReset}
              className="text-xs uppercase tracking-widest text-destructive hover:underline"
            >
              Reset Antrian Hari Ini
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c) => {
              const count = tickets.filter((t) => t.category_id === c.id).length;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-card-gradient ring-gold p-5"
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {c.code}
                  </div>
                  <div className="font-display text-xl font-bold mt-1">
                    {c.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display tabular-nums text-3xl font-black text-gold-gradient">
                      {c.prefix}xxx
                    </span>
                    <span className="text-sm text-muted-foreground">
                      • {count} nomor
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live counter overview */}
        <section>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Overview Semua Loket
          </div>
          <CounterGrid counters={counters} tickets={tickets} />
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "gold" | "success" | "warn";
}) {
  const color =
    accent === "gold"
      ? "text-gold-gradient"
      : accent === "success"
        ? "text-[color:var(--success)]"
        : accent === "warn"
          ? "text-[color:var(--warning)]"
          : "text-foreground";
  return (
    <div className="rounded-2xl bg-card-gradient ring-gold p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display tabular-nums text-4xl font-black ${color}`}
      >
        {value}
      </div>
    </div>
  );
}
