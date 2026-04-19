import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  code: string;
  name: string;
  prefix: string;
  color: string;
  sort_order: number;
};

export type Counter = {
  id: string;
  number: number;
  name: string;
  is_active: boolean;
  current_ticket_id: string | null;
};

export type Ticket = {
  id: string;
  category_id: string;
  ticket_number: string;
  sequence_number: number;
  status: "waiting" | "called" | "serving" | "done" | "skipped";
  counter_id: string | null;
  called_at: string | null;
  done_at: string | null;
  issued_at: string;
  issue_date: string;
};

export type CallEvent = {
  id: string;
  ticket_id: string;
  counter_id: string;
  ticket_number: string;
  counter_number: number;
  event_type: "call" | "recall";
  created_at: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("queue_categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchCounters(): Promise<Counter[]> {
  const { data, error } = await supabase
    .from("counters")
    .select("*")
    .order("number");
  if (error) throw error;
  return (data ?? []) as Counter[];
}

export async function fetchTodayTickets(): Promise<Ticket[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("issue_date", today)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

export async function issueTicket(categoryCode: string): Promise<Ticket> {
  const { data, error } = await supabase.rpc("issue_ticket", {
    p_category_code: categoryCode,
  });
  if (error) throw error;
  return data as unknown as Ticket;
}

export async function callNext(counterId: string): Promise<Ticket | null> {
  const { data, error } = await supabase.rpc("call_next_ticket", {
    p_counter_id: counterId,
  });
  if (error) throw error;
  return (data ?? null) as Ticket | null;
}

export async function recall(counterId: string) {
  const { error } = await supabase.rpc("recall_ticket", { p_counter_id: counterId });
  if (error) throw error;
}

export async function skip(counterId: string) {
  const { error } = await supabase.rpc("skip_ticket", { p_counter_id: counterId });
  if (error) throw error;
}

export async function resetDaily() {
  const { error } = await supabase.rpc("reset_daily_queue");
  if (error) throw error;
}

/** Speak ticket call via Web Speech API (id-ID) */
export function speakCall(ticketNumber: string, counterNumber: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  // split number to letters+digits for clearer pronunciation
  const letters = ticketNumber.replace(/\d/g, "");
  const digits = ticketNumber.replace(/\D/g, "").split("").join(" ");
  const text = `Nomor antrian ${letters} ${digits}, silakan menuju loket ${counterNumber}`;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "id-ID";
  utter.rate = 0.95;
  utter.pitch = 1;
  // try pick Indonesian voice
  const voices = synth.getVoices();
  const id = voices.find((v) => v.lang?.toLowerCase().startsWith("id"));
  if (id) utter.voice = id;
  // play a soft chime first by speaking a tiny silent utterance
  synth.cancel();
  synth.speak(utter);
}
