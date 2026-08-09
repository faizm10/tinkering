import { addDays, format, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";

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
