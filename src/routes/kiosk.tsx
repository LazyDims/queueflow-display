import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import { issueTicket, type Ticket } from "@/lib/queue";
import { LiveClock } from "@/components/LiveClock";

export const Route = createFileRoute("/kiosk")({
  head: () => ({
    meta: [
      { title: "Ambil Nomor Antrian — Antrean Digital" },
      {
        name: "description",
        content: "Ambil nomor antrian sesuai kategori layanan yang Anda butuhkan.",
      },
    ],
  }),
  component: KioskPage,
});

function KioskPage() {
  const { categories } = useRealtimeQueue();
  const [issued, setIssued] = useState<Ticket | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const onTake = async (code: string) => {
    setBusyCode(code);
    try {
      const t = await issueTicket(code);
      setIssued(t);
    } catch (e) {
      alert("Gagal mengambil nomor antrian.");
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold to-gold-glow text-navy-deep font-black shadow-glow">
            AD
          </div>
          <div>
            <div className="font-display text-lg font-bold">Ambil Nomor</div>
            <div className="text-xs text-muted-foreground -mt-0.5">
              Pilih layanan yang Anda butuhkan
            </div>
          </div>
        </Link>
        <LiveClock />
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        {issued ? (
          <TicketReceipt ticket={issued} onClose={() => setIssued(null)} />
        ) : (
          <section className="grid gap-5 md:grid-cols-3 mt-8">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => onTake(c.code)}
                disabled={busyCode === c.code}
                className="group relative overflow-hidden rounded-3xl bg-card-gradient ring-gold p-8 text-left transition-all hover:-translate-y-1 hover:shadow-glow disabled:opacity-50"
              >
                <div className="font-display text-7xl font-black text-gold-gradient tabular-nums">
                  {c.prefix}
                </div>
                <div className="mt-2 font-display text-2xl font-extrabold">
                  {c.name}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {c.code}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-glow px-5 py-2 text-sm font-bold text-navy-deep">
                  Ambil Nomor →
                </div>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function TicketReceipt({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  return (
    <div className="mt-10 mx-auto max-w-xl rounded-3xl bg-card-gradient ring-gold p-10 text-center shadow-card-elev animate-slide-up-in">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Nomor Antrian Anda
      </div>
      <div
        className="mt-3 font-display font-black text-gold-gradient tabular-nums leading-none animate-ticker-pop"
        style={{ fontSize: "clamp(7rem, 18vw, 14rem)" }}
      >
        {ticket.ticket_number}
      </div>
      <div className="mt-4 text-lg text-muted-foreground">
        Mohon menunggu dipanggil di layar
      </div>
      <button
        onClick={onClose}
        className="mt-8 rounded-xl bg-gradient-to-br from-gold to-gold-glow px-6 py-3 font-display font-bold text-navy-deep shadow-glow"
      >
        Selesai
      </button>
    </div>
  );
}
