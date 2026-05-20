import { useEffect, useRef, useState } from "react";
import { useRealtimeQueue } from "@/hooks/useRealtimeQueue";
import info1 from "@/assets/info-1.jpg";
import info2 from "@/assets/info-2.jpg";
import info3 from "@/assets/info-3.jpg";
import selayang_pandang from "@/assets/SELAYANG_PANDANG_2026_FIX.mp4";

type Slide = {
  src?: string; // fallback image / poster
  videoSrc?: string; // optional video source (mp4/webm)
  title: string;
  subtitle: string;
};

// Example slides: currently use images as posters. To use videos,
// add `videoSrc: '/assets/info-1.mp4'` (or import the mp4) for a slide.
const SLIDES: Slide[] = [
  {
    src: selayang_pandang,
    videoSrc: selayang_pandang,
    title: "Selayang Pandang",
    subtitle: "Sekilas tentang Dinas Pendapatan Daerah Kota Bandung",
  },
  {
    src: info1,
    // videoSrc: '/assets/info-1.mp4',
    title: "Pelayanan Prima",
    subtitle: "Cepat, ramah, profesional untuk masyarakat",
  },
  {
    src: info2,
    // videoSrc: '/assets/info-2.mp4',
    title: "Layanan Prioritas",
    subtitle: "Lansia, ibu hamil, dan disabilitas didahulukan",
  },
  {
    src: info3,
    // videoSrc: '/assets/info-3.mp4',
    title: "Bayar PBB & Pajak",
    subtitle: "Loket B siap melayani pembayaran pajak Anda",
  },
];

export function InfoSlideshow() {
  const [idx, setIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1); // 0..1
  const [isDucking, setIsDucking] = useState(false);
  const duckFactor = 0.25; // volume multiplier when ducking (25%)
  const duckTimerRef = useRef<number | null>(null);
  const { lastEvent } = useRealtimeQueue();
  useEffect(() => {
    // Advance automatically for non-video slides; for video slides
    // advancement is handled by the video's `ended` event.
    const current = SLIDES[idx];
    if (current.videoSrc) {
      // No timer: ensure video (if mounted) starts playing from start.
      const el = document.getElementById(`info-video-${idx}`) as
        | HTMLVideoElement
        | null;
      if (el) {
        el.loop = false;
        el.currentTime = 0;
        el.muted = isMuted;
        el.play().catch(() => {});
      }
      return;
    }

    const t = setTimeout(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearTimeout(t);
  }, [idx]);

  // Adjust video element volumes when volume/mute/ducking changes
  useEffect(() => {
    const vids = Array.from(document.querySelectorAll<HTMLVideoElement>("video[id^=\"info-video-\"]"));
    vids.forEach((v) => {
      const target = isMuted ? 0 : isDucking ? Math.max(0, Math.min(1, volume * duckFactor)) : Math.max(0, Math.min(1, volume));
      v.volume = target;
      // keep muted attribute in sync too
      v.muted = isMuted;
    });
  }, [volume, isMuted, isDucking]);

  // Listen for queue call events to duck audio
  useEffect(() => {
    if (!lastEvent) return;
    // start ducking
    setIsDucking(true);
    if (duckTimerRef.current) window.clearTimeout(duckTimerRef.current);
    // keep ducking for ~7s, enough for TTS and chime
    duckTimerRef.current = window.setTimeout(() => {
      setIsDucking(false);
      duckTimerRef.current = null;
    }, 7000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl ring-gold shadow-card-elev">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          {s.videoSrc ? (
            <video
              id={`info-video-${i}`}
              src={s.videoSrc}
              poster={s.src}
              className="h-full w-full object-cover"
              autoPlay
              muted={isMuted}
              playsInline
              preload="metadata"
              onEnded={() => setIdx((p) => (p + 1) % SLIDES.length)}
            />
          ) : (
            <img
              src={s.src}
              alt={s.title}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          )}
{/* 
          <div className="absolute inset-0 bg-linear-to-t from-navy-deep/95 via-navy-deep/40 to-transparent" /> */}
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
      {/* unmute toggle */}
      <button
        aria-label={isMuted ? "Unmute slideshow" : "Mute slideshow"}
        onClick={() => {
          const next = !isMuted;
          setIsMuted(next);
          document.querySelectorAll<HTMLVideoElement>("video[id^=\"info-video-\"]").forEach((v) => {
            v.muted = next;
          });
          if (!next) {
            const cur = document.getElementById(`info-video-${idx}`) as HTMLVideoElement | null;
            cur?.play().catch(() => {});
            try {
              // resume audio context if present/needed (some platforms require user gesture)
              const ac = (window as any).audioContext as AudioContext | undefined;
              ac?.resume?.();
            } catch {}
          }
        }
        }
        className="absolute top-6 left-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/60 text-base"
      >
        {isMuted ? "🔈" : "🔊"}
      </button>
    </div>
  );
}
