
-- Categories: kategori antrian (UMUM, PBB, PRIORITAS)
CREATE TABLE public.queue_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gold',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Counters: loket
CREATE TABLE public.counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_ticket_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets: nomor antrian
CREATE TYPE public.ticket_status AS ENUM ('waiting', 'called', 'serving', 'done', 'skipped');

CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.queue_categories(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  sequence_number INT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'waiting',
  counter_id UUID REFERENCES public.counters(id) ON DELETE SET NULL,
  called_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issue_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date
);

CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_date ON public.tickets(issue_date);
CREATE INDEX idx_tickets_category_date ON public.tickets(category_id, issue_date);

-- Announcement event for display TTS (insert-only "events" pattern via Realtime)
CREATE TABLE public.call_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  counter_id UUID NOT NULL REFERENCES public.counters(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  counter_number INT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'call', -- 'call' | 'recall'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_events_created ON public.call_events(created_at DESC);

-- FK now that tickets exists
ALTER TABLE public.counters
  ADD CONSTRAINT counters_current_ticket_fk
  FOREIGN KEY (current_ticket_id) REFERENCES public.tickets(id) ON DELETE SET NULL;

-- Enable RLS (public read/write for demo without auth)
ALTER TABLE public.queue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;

-- Public access (no-auth demo)
CREATE POLICY "public read categories" ON public.queue_categories FOR SELECT USING (true);
CREATE POLICY "public write categories" ON public.queue_categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read counters" ON public.counters FOR SELECT USING (true);
CREATE POLICY "public write counters" ON public.counters FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "public write tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read events" ON public.call_events FOR SELECT USING (true);
CREATE POLICY "public write events" ON public.call_events FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_counters_updated BEFORE UPDATE ON public.counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Issue a new ticket (atomic per category per day)
CREATE OR REPLACE FUNCTION public.issue_ticket(p_category_code TEXT)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat public.queue_categories%ROWTYPE;
  v_seq INT;
  v_ticket public.tickets%ROWTYPE;
  v_today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  SELECT * INTO v_cat FROM public.queue_categories WHERE code = p_category_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found: %', p_category_code; END IF;

  SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_seq
  FROM public.tickets
  WHERE category_id = v_cat.id AND issue_date = v_today;

  INSERT INTO public.tickets (category_id, ticket_number, sequence_number, issue_date)
  VALUES (v_cat.id, v_cat.prefix || LPAD(v_seq::text, 3, '0'), v_seq, v_today)
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$;

-- Call next ticket for a counter
CREATE OR REPLACE FUNCTION public.call_next_ticket(p_counter_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
  v_counter public.counters%ROWTYPE;
  v_today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  SELECT * INTO v_counter FROM public.counters WHERE id = p_counter_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Counter not found'; END IF;

  -- mark previous as done
  IF v_counter.current_ticket_id IS NOT NULL THEN
    UPDATE public.tickets SET status = 'done', done_at = now()
    WHERE id = v_counter.current_ticket_id AND status IN ('called','serving');
  END IF;

  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE status = 'waiting' AND issue_date = v_today
  ORDER BY
    -- prioritas dulu (prefix P)
    (SELECT prefix FROM public.queue_categories c WHERE c.id = tickets.category_id) DESC NULLS LAST,
    issued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    UPDATE public.counters SET current_ticket_id = NULL WHERE id = p_counter_id;
    RETURN NULL;
  END IF;

  UPDATE public.tickets
  SET status = 'called', counter_id = p_counter_id, called_at = now()
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  UPDATE public.counters SET current_ticket_id = v_ticket.id WHERE id = p_counter_id;

  INSERT INTO public.call_events (ticket_id, counter_id, ticket_number, counter_number, event_type)
  VALUES (v_ticket.id, p_counter_id, v_ticket.ticket_number, v_counter.number, 'call');

  RETURN v_ticket;
END;
$$;

-- Recall current ticket
CREATE OR REPLACE FUNCTION public.recall_ticket(p_counter_id UUID)
RETURNS public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counter public.counters%ROWTYPE;
  v_ticket public.tickets%ROWTYPE;
BEGIN
  SELECT * INTO v_counter FROM public.counters WHERE id = p_counter_id;
  IF v_counter.current_ticket_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_ticket FROM public.tickets WHERE id = v_counter.current_ticket_id;
  INSERT INTO public.call_events (ticket_id, counter_id, ticket_number, counter_number, event_type)
  VALUES (v_ticket.id, p_counter_id, v_ticket.ticket_number, v_counter.number, 'recall');
  RETURN v_ticket;
END;
$$;

-- Skip current ticket
CREATE OR REPLACE FUNCTION public.skip_ticket(p_counter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counter public.counters%ROWTYPE;
BEGIN
  SELECT * INTO v_counter FROM public.counters WHERE id = p_counter_id;
  IF v_counter.current_ticket_id IS NOT NULL THEN
    UPDATE public.tickets SET status = 'skipped', done_at = now()
    WHERE id = v_counter.current_ticket_id;
    UPDATE public.counters SET current_ticket_id = NULL WHERE id = p_counter_id;
  END IF;
END;
$$;

-- Reset daily queue
CREATE OR REPLACE FUNCTION public.reset_daily_queue()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.counters SET current_ticket_id = NULL;
  DELETE FROM public.tickets WHERE issue_date = (now() AT TIME ZONE 'Asia/Jakarta')::date;
END;
$$;

-- Seed categories & counters
INSERT INTO public.queue_categories (code, name, prefix, color, sort_order) VALUES
  ('UMUM', 'Layanan Umum', 'A', 'gold', 1),
  ('PBB', 'PBB & Pajak', 'B', 'blue', 2),
  ('PRIORITAS', 'Prioritas (Lansia/Disabilitas)', 'P', 'red', 3);

INSERT INTO public.counters (number, name) VALUES
  (1, 'Loket 1'),
  (2, 'Loket 2'),
  (3, 'Loket 3'),
  (4, 'Loket 4'),
  (5, 'Loket 5'),
  (6, 'Loket 6');

-- Enable Realtime
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.counters REPLICA IDENTITY FULL;
ALTER TABLE public.call_events REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.counters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_events;
