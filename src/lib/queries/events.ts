import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoEvents, type DemoEvent } from "@/lib/demo-data";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  price_info: string | null;
};

export async function getUpcomingEvents(): Promise<DemoEvent[]> {
  if (!isSupabaseConfigured) {
    return demoEvents;
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("events")
      .select("id, title, description, event_date, event_time, price_info")
      .eq("is_published", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .returns<EventRow[]>();

    if (error || !data || data.length === 0) {
      return demoEvents;
    }

    return data.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      date: event.event_date,
      time: event.event_time ?? "",
      priceInfo: event.price_info ?? "Sur réservation",
    }));
  } catch {
    return demoEvents;
  }
}
