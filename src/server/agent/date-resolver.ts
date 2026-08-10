import { addDays, addMonths, format, isBefore, parseISO, startOfDay } from "date-fns";

import { todayISO } from "@/lib/dates";

const months = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const monthNames: Record<string, string> = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

export type ResolvedDateExpression = {
  raw: string;
  timezone: string;
  referenceDate: string;
  startDate: string | null;
  endDate: string | null;
  confidence: "low" | "medium" | "high";
  requiresClarification: boolean;
  explanation: string;
};

function normalizeMonth(month: string) {
  return monthNames[month.toLowerCase().slice(0, 3)] ?? month;
}

function nextMonthDay(month: string, day: string, now: Date) {
  const monthName = normalizeMonth(month);
  const candidate = new Date(`${monthName} ${day}, ${now.getFullYear()} 12:00:00`);
  if (isBefore(candidate, startOfDay(now))) candidate.setFullYear(candidate.getFullYear() + 1);
  return todayISO(candidate);
}

export function resolveDateExpression(raw: string, timezone = "America/Toronto", now = new Date()): ResolvedDateExpression {
  const normalized = raw.toLowerCase();
  const referenceDate = todayISO(now);

  const range = normalized.match(new RegExp(`\\b(${months})\\.?\\s+(\\d{1,2})\\s+(?:to|through|-)\\s+(${months})?\\.?\\s*(\\d{1,2})\\b`, "i"));
  if (range) {
    const startDate = nextMonthDay(range[1], range[2], now);
    const endMonth = range[3] || range[1];
    const endDate = nextMonthDay(endMonth, range[4], now);
    return { raw, timezone, referenceDate, startDate, endDate, confidence: "high", requiresClarification: false, explanation: `Interpreted as ${startDate} to ${endDate}.` };
  }

  if (normalized.includes("today")) return { raw, timezone, referenceDate, startDate: referenceDate, endDate: referenceDate, confidence: "high", requiresClarification: false, explanation: "Interpreted as today." };

  if (normalized.includes("tomorrow")) {
    const date = todayISO(addDays(now, 1));
    return { raw, timezone, referenceDate, startDate: date, endDate: date, confidence: "high", requiresClarification: false, explanation: "Interpreted as tomorrow." };
  }

  const inDays = normalized.match(/\bin\s+(\d{1,3})\s+days?\b|(\d{1,3})\s+days?\s+to\s+return/);
  if (inDays) {
    const count = Number(inDays[1] ?? inDays[2]);
    const date = todayISO(addDays(now, count));
    return { raw, timezone, referenceDate, startDate: date, endDate: date, confidence: "high", requiresClarification: false, explanation: `Interpreted as ${count} days from the reference date.` };
  }

  if (normalized.includes("next monday")) {
    const day = now.getDay();
    const distance = (8 - day) % 7 || 7;
    const date = todayISO(addDays(now, distance));
    return { raw, timezone, referenceDate, startDate: date, endDate: date, confidence: "high", requiresClarification: false, explanation: "Interpreted as the next upcoming Monday." };
  }

  const monthDay = normalized.match(new RegExp(`\\b(${months})\\.?\\s+(\\d{1,2})\\b`, "i"));
  if (monthDay) {
    const date = nextMonthDay(monthDay[1], monthDay[2], now);
    return { raw, timezone, referenceDate, startDate: date, endDate: date, confidence: "high", requiresClarification: false, explanation: `Interpreted as the next upcoming ${format(parseISO(date), "MMMM d")}.` };
  }

  if (normalized.includes("next month")) {
    const date = todayISO(addMonths(now, 1));
    return { raw, timezone, referenceDate, startDate: date, endDate: date, confidence: "medium", requiresClarification: false, explanation: "Interpreted as one month from the reference date." };
  }

  const iso = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return { raw, timezone, referenceDate, startDate: iso[1], endDate: iso[1], confidence: "high", requiresClarification: false, explanation: "Interpreted as an explicit ISO date." };

  return { raw, timezone, referenceDate, startDate: null, endDate: null, confidence: "low", requiresClarification: true, explanation: "No precise date could be resolved." };
}
