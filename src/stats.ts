import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { configDir } from "./config.js";

export interface FocusSession {
  /** Local calendar date, formatted as YYYY-MM-DD. */
  date: string;
  minutes: number;
  recordedAt: string;
}

export interface FocusStats {
  totalSessions: number;
  totalMinutes: number;
  todaySessions: number;
  todayMinutes: number;
  currentStreak: number;
  bestStreak: number;
  perDate: Map<string, { sessions: number; minutes: number }>;
}

export function localDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Shift a YYYY-MM-DD date string by whole days (UTC-based, DST-safe). */
export function shiftDate(date: string, days: number): string {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000);
  return next.toISOString().slice(0, 10);
}

function diffDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function statsFile(): string {
  return join(configDir(), "stats.json");
}

export function loadSessions(): FocusSession[] {
  try {
    if (!existsSync(statsFile())) return [];
    const parsed: unknown = JSON.parse(readFileSync(statsFile(), "utf8"));
    if (!Array.isArray(parsed)) return [];

    const sessions: FocusSession[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const raw = entry as Partial<FocusSession>;
      if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) continue;
      if (typeof raw.minutes !== "number" || !Number.isFinite(raw.minutes) || raw.minutes <= 0) {
        continue;
      }
      sessions.push({
        date: raw.date,
        minutes: raw.minutes,
        recordedAt: typeof raw.recordedAt === "string" ? raw.recordedAt : new Date().toISOString(),
      });
    }
    return sessions;
  } catch {
    // A broken stats file should never brick the CLI — start fresh.
    return [];
  }
}

export function recordSession(minutes: number): void {
  const sessions = loadSessions();
  sessions.push({
    date: localDate(new Date()),
    minutes,
    recordedAt: new Date().toISOString(),
  });
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(statsFile(), JSON.stringify(sessions, null, 2) + "\n", "utf8");
}

export function computeStats(sessions: FocusSession[], today: Date = new Date()): FocusStats {
  const perDate = new Map<string, { sessions: number; minutes: number }>();
  let totalSessions = 0;
  let totalMinutes = 0;

  for (const session of sessions) {
    totalSessions += 1;
    totalMinutes += session.minutes;
    const bucket = perDate.get(session.date) ?? { sessions: 0, minutes: 0 };
    bucket.sessions += 1;
    bucket.minutes += session.minutes;
    perDate.set(session.date, bucket);
  }

  // Best streak: longest run of consecutive calendar days.
  const dates = [...perDate.keys()].sort();
  let bestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of dates) {
    run = previous !== undefined && diffDays(previous, date) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = date;
  }

  // Current streak: walks back from today. A streak survives until the day
  // actually ends, so sessions "yesterday only" still count as a live streak.
  const todayStr = localDate(today);
  const yesterdayStr = shiftDate(todayStr, -1);
  let cursor = perDate.has(todayStr)
    ? todayStr
    : perDate.has(yesterdayStr)
      ? yesterdayStr
      : undefined;
  let currentStreak = 0;
  while (cursor !== undefined && perDate.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDate(cursor, -1);
  }

  const todayBucket = perDate.get(todayStr);
  return {
    totalSessions,
    totalMinutes,
    todaySessions: todayBucket?.sessions ?? 0,
    todayMinutes: todayBucket?.minutes ?? 0,
    currentStreak,
    bestStreak,
    perDate,
  };
}
