import { addDays, differenceInCalendarDays, format, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";

export function todayISO(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function parseNaturalDate(value: string, now = new Date()): string | null {
  const normalized = value.toLowerCase();
  if (normalized.includes("today")) return todayISO(now);
  if (normalized.includes("tomorrow")) return todayISO(addDays(now, 1));
  if (normalized.includes("next monday")) {
    const day = now.getDay();
    const distance = (8 - day) % 7 || 7;
    return todayISO(addDays(now, distance));
  }

  const explicit = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (explicit) return explicit[0];

  const monthDay = value.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i,
  );
  if (monthDay) {
    const candidate = new Date(`${monthDay[1]} ${monthDay[2]}, ${now.getFullYear()}`);
    if (isBefore(candidate, startOfDay(now))) {
      candidate.setFullYear(candidate.getFullYear() + 1);
    }
    return todayISO(candidate);
  }

  return null;
}

export function isDueToday(date: string | null | undefined, now = new Date()) {
  return Boolean(date && isSameDay(parseISO(date), now));
}

export function isOverdue(date: string | null | undefined, now = new Date()) {
  return Boolean(date && isBefore(parseISO(date), startOfDay(now)));
}

/** Calendar days from today to `date`. Negative when the date has passed. */
export function daysUntil(date: string, now = new Date()) {
  return differenceInCalendarDays(parseISO(date), startOfDay(now));
}

/** "Aug 14" — or "Aug 14, 2027" once the year stops being obvious. */
export function formatShortDate(date: string, now = new Date()) {
  const parsed = parseISO(date);
  const sameYear = parsed.getFullYear() === now.getFullYear();
  return format(parsed, sameYear ? "MMM d" : "MMM d, yyyy");
}

/**
 * Human phrasing for a deadline: "Today", "Tomorrow", "Overdue by 2 days".
 * Falls back to a short date once a deadline is more than a week out, because
 * "in 34 days" is harder to act on than "Sep 12".
 */
export function formatDueLabel(date: string, now = new Date()) {
  const days = daysUntil(date, now);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Overdue by 1 day";
  if (days < -1) return `Overdue by ${Math.abs(days)} days`;
  if (days <= 7) return `In ${days} days`;
  return formatShortDate(date, now);
}

/** "3 days", "1 day", "today" — for how long something has been waiting. */
export function formatElapsed(since: string, now = new Date()) {
  const days = Math.max(0, differenceInCalendarDays(startOfDay(now), parseISO(since)));
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

/** "Aug 16 – Aug 20", or a single date when only one end is known. */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  now = new Date(),
) {
  if (start && end) return `${formatShortDate(start, now)} – ${formatShortDate(end, now)}`;
  if (start) return `From ${formatShortDate(start, now)}`;
  if (end) return `By ${formatShortDate(end, now)}`;
  return "No dates set";
}
