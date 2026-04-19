import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories,
  fetchCounters,
  fetchTodayTickets,
  type CallEvent,
  type Category,
  type Counter,
  type Ticket,
} from "@/lib/queue";

export function useRealtimeQueue() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastEvent, setLastEvent] = useState<CallEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [c, l, t] = await Promise.all([
        fetchCategories(),
        fetchCounters(),
        fetchTodayTickets(),
      ]);
      if (!mounted) return;
      setCategories(c);
      setCounters(l);
      setTickets(t);
      setLoading(false);
    })();

    const channel = supabase
      .channel("queue-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        async () => {
          const t = await fetchTodayTickets();
          setTickets(t);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "counters" },
        async () => {
          const l = await fetchCounters();
          setCounters(l);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_events" },
        (payload) => {
          setLastEvent(payload.new as CallEvent);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { categories, counters, tickets, lastEvent, loading };
}
