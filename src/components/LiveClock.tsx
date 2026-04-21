"use client";

import { useEffect, useState } from "react";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="font-display tabular-nums text-3xl md:text-5xl font-bold tracking-tight text-gold-gradient">
        {hh} :
        <span className="animate-blink-soft">:</span>
        {mm}
        <span className="text-foreground/60 text-2xl md:text-3xl"> : {ss}</span>
      </div>
      <div className="text-xs md:text-base text-muted-foreground tracking-wide uppercase">
        {dateStr}
      </div>
    </div>
  );
}
