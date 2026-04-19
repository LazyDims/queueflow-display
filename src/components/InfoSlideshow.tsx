import { useEffect, useState } from "react";
import info1 from "@/assets/info-1.jpg";
import info2 from "@/assets/info-2.jpg";
import info3 from "@/assets/info-3.jpg";

type Slide = { src: string; title: string; subtitle: string };

const SLIDES: Slide[] = [
  {
    src: info1,
    title: "Pelayanan Prima",
    subtitle: "Cepat, ramah, profesional untuk masyarakat",
  },
  {
    src: info2,
    title: "Layanan Prioritas",
    subtitle: "Lansia, ibu hamil, dan disabilitas didahulukan",
  },
  {
    src: info3,
    title: "Bayar PBB & Pajak",
    subtitle: "Loket B siap melayani pembayaran pajak Anda",
  },
];

export function InfoSlideshow() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl ring-gold shadow-card-elev">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img
            src={s.src}
            alt={s.title}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/95 via-navy-deep/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-navy/60 px-4 py-1.5 text-xs uppercase tracking-widest text-gold backdrop-blur">
              Informasi Layanan
            </div>
            <h3 className="mt-3 font-display text-3xl md:text-5xl font-extrabold leading-tight">
              {s.title}
            </h3>
            <p className="mt-2 text-base md:text-xl text-muted-foreground max-w-2xl">
              {s.subtitle}
            </p>
          </div>
        </div>
      ))}
      {/* dots */}
      <div className="absolute top-6 right-6 flex gap-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-8 bg-gold" : "w-3 bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
