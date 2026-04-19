import { useEffect, useRef, useState } from "react";
import type { Counter, Ticket } from "@/lib/queue";

interface Props {
  counters: Counter[];
  tickets: Ticket[];
  highlightCounterId?: string | null;
}

function ticketForCounter(counter: Counter, tickets: Ticket[]): Ticket | undefined {
  if (!counter.current_ticket_id) return undefined;
  return tickets.find((t) => t.id === counter.current_ticket_id);
}

export function CounterGrid({ counters, tickets, highlightCounterId }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {counters.map((c) => {
        const t = ticketForCounter(c, tickets);
        const active = highlightCounterId === c.id;
        return (
          <CounterCard
            key={c.id}
            counter={c}
            ticket={t}
            highlight={active}
          />
        );
      })}
    </div>
  );
}

function CounterCard({
  counter,
  ticket,
  highlight,
}: {
  counter: Counter;
  ticket?: Ticket;
  highlight: boolean;
}) {
  const [pulse, setPulse] = useState(false);
  const last = useRef<string | undefined>(ticket?.id);

  useEffect(() => {
    if (ticket?.id && ticket.id !== last.current) {
      setPulse(true);
      last.current = ticket.id;
      const id = setTimeout(() => setPulse(false), 1800);
      return () => clearTimeout(id);
    }
  }, [ticket?.id]);

  return (
    <div
      className={`relative rounded-2xl p-4 md:p-5 bg-card-gradient ring-gold transition-all duration-300 ${
        highlight || pulse ? "scale-[1.04] shadow-glow" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Loket
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            ticket ? "bg-gold animate-pulse-glow" : "bg-foreground/20"
          }`}
        />
      </div>
      <div className="mt-1 font-display text-2xl md:text-3xl font-extrabold">
        {counter.number.toString().padStart(2, "0")}
      </div>
      <div className="mt-3 rounded-xl bg-navy-deep/60 px-3 py-3 text-center min-h-[68px] flex items-center justify-center">
        <span
          className={`font-display tabular-nums text-2xl md:text-4xl font-black ${
            ticket ? "text-gold-gradient" : "text-foreground/30"
          } ${pulse ? "animate-ticker-pop" : ""}`}
        >
          {ticket?.ticket_number ?? "—"}
        </span>
      </div>
    </div>
  );
}
