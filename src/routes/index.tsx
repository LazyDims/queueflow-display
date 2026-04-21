import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { LiveClock } from "@/components/LiveClock";
import AppMark from "@/components/AppMark";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <AppMark className="h-12 w-12 md:h-11 md:w-11 text-lg" />
          <div>
            <div className="font-display text-lg font-bold">Antrean Digital</div>
            <div className="text-xs text-muted-foreground -mt-0.5">
              Kecamatan Gayamsari
            </div>
          </div>
        </div>
        <LiveClock />
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-10 pb-24">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="animate-slide-up-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy/60 px-4 py-1.5 text-xs uppercase tracking-widest text-gold backdrop-blur">
              Real-time • Multi-loket • Modern
            </span>
            <h1 className="mt-5 font-display text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
              Sistem Antrian{" "}
              <span className="text-gold-gradient">Loket Digital</span>{" "}
              untuk pelayanan publik.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Tampilan layar TV yang elegan, dashboard petugas yang ringkas,
              dan ambil nomor antrian dari mana saja — semua tersinkron secara
              real-time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <NavCard
                to="/display"
                title="Layar Display TV"
                subtitle="Tampilkan di ruang tunggu (Full HD)"
                accent
              />
              <NavCard
                to="/admin"
                title="Dashboard Petugas"
                subtitle="Panggil, ulangi, lewati antrian"
              />
              <NavCard
                to="/kiosk"
                title="Ambil Nomor"
                subtitle="Untuk masyarakat / kiosk"
              />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-card-gradient ring-gold p-8 md:p-10 shadow-card-elev">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Nomor Antrian
              </div>
              <div className="mt-2 font-display text-[7rem] md:text-[10rem] font-black leading-none text-gold-gradient tabular-nums">
                A-024
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl text-muted-foreground">menuju</div>
                <div className="font-display text-3xl md:text-4xl font-extrabold">
                  Loket 02
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {["A-021", "A-022", "B-008"].map((n, i) => (
                  <div
                    key={n}
                    className="rounded-xl bg-navy-deep/60 py-3 text-center"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Loket {i + 3}
                    </div>
                    <div className="font-display tabular-nums text-2xl font-bold text-gold-gradient">
                      {n}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavCard({
  to,
  title,
  subtitle,
  accent,
}: {
  to: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 ${
        accent
          ? "bg-gradient-to-br from-gold to-gold-glow text-navy-deep shadow-glow"
          : "bg-card-gradient ring-gold text-foreground"
      }`}
    >
      <div className="font-display text-base font-bold">{title}</div>
      <div
        className={`text-xs ${accent ? "text-navy-deep/70" : "text-muted-foreground"}`}
      >
        {subtitle}
      </div>
    </Link>
  );
}
