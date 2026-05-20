import { useEffect, useRef, useState } from "react";
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
  const mountedRef = useRef(true);

  const refetchAll = async () => {
    const [l, t] = await Promise.all([fetchCounters(), fetchTodayTickets()]);
    if (!mountedRef.current) return;
    setCounters(l);
    setTickets(t);
  };

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const [c, l, t] = await Promise.all([
        fetchCategories(),
        fetchCounters(),
        fetchTodayTickets(),
      ]);
      if (!mountedRef.current) return;
      setCategories(c);
      setCounters(l);
      setTickets(t);
      setLoading(false);
    })();

    // Use a unique channel name per hook instance to avoid re-using a
    // previously-subscribed channel (HMR or multi-mount cases can cause
    // "cannot add ... after subscribe" errors). The real-time topic (table
    // filters) still match regardless of channel name.
    const channelName = `queue-realtime-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        async () => {
          const t = await fetchTodayTickets();
          if (mountedRef.current) setTickets(t);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "counters" },
        async () => {
          const l = await fetchCounters();
          if (mountedRef.current) setCounters(l);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_events" },
        (payload: { new: CallEvent; }) => {
          if (mountedRef.current) setLastEvent(payload.new as CallEvent);
        }
      )
      .subscribe(async (status: string) => {
        // Setelah channel berhasil subscribe, refetch untuk catch-up
        // data yang mungkin berubah saat sedang connecting
        if (status === "SUBSCRIBED" && mountedRef.current) {
          const [l, t] = await Promise.all([fetchCounters(), fetchTodayTickets()]);
          if (mountedRef.current) {
            setCounters(l);
            setTickets(t);
          }
        }
      });

    // Channel khusus untuk sinyal sistem (reset)
    const systemChannel = supabase
      .channel("queue-system-events")
      .on("broadcast", { event: "queue_reset" }, async () => {
        if (!mountedRef.current) return;
        await refetchAll();
        if (mountedRef.current) setLastEvent(null);
      })
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(systemChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { categories, counters, tickets, lastEvent, loading };
}
