import { CalendarClient } from "@/components/calendar/CalendarClient";

export default function CalendarPage() {
  // Token is read server-side and handed to the (auth-gated) client page so it
  // can build the subscribe URL. Empty string hides the subscribe control.
  return <CalendarClient feedToken={process.env.CALENDAR_FEED_TOKEN ?? ""} />;
}
