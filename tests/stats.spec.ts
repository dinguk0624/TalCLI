import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ root: "" }));

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir: () => state.root };
});

import {
  computeStats,
  loadSessions,
  localDate,
  recordSession,
  shiftDate,
  type FocusSession,
} from "../src/stats.js";

function session(date: string, minutes: number): FocusSession {
  return { date, minutes, recordedAt: `${date}T10:00:00.000Z` };
}

describe("date helpers", () => {
  it("formats a local calendar date", () => {
    const date = new Date(2026, 8, 27, 23, 59); // Sep 27 2026, local time
    expect(localDate(date)).toBe("2026-09-27");
  });

  it("shifts dates across month boundaries", () => {
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("computeStats", () => {
  it("handles an empty history", () => {
    const stats = computeStats([], new Date(2026, 8, 27));
    expect(stats.totalSessions).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(0);
  });

  it("sums totals and today's numbers", () => {
    const sessions = [
      session("2026-09-27", 25),
      session("2026-09-27", 5),
      session("2026-09-25", 10),
    ];
    const stats = computeStats(sessions, new Date(2026, 8, 27));
    expect(stats.totalSessions).toBe(3);
    expect(stats.totalMinutes).toBe(40);
    expect(stats.todaySessions).toBe(2);
    expect(stats.todayMinutes).toBe(30);
  });

  it("computes the best streak across consecutive days", () => {
    const sessions = [
      session("2026-09-20", 10),
      session("2026-09-21", 10),
      session("2026-09-22", 10),
      session("2026-09-24", 10),
      session("2026-09-25", 10),
    ];
    const stats = computeStats(sessions, new Date(2026, 8, 27));
    expect(stats.bestStreak).toBe(3); // 20-22
  });

  it("keeps yesterday-only streaks alive until today ends", () => {
    const sessions = [session("2026-09-26", 25)];
    const stats = computeStats(sessions, new Date(2026, 8, 27));
    expect(stats.currentStreak).toBe(1);
  });

  it("counts today's session as part of the current streak", () => {
    const sessions = [
      session("2026-09-25", 10),
      session("2026-09-26", 10),
      session("2026-09-27", 10),
    ];
    const stats = computeStats(sessions, new Date(2026, 8, 27));
    expect(stats.currentStreak).toBe(3);
  });

  it("breaks the streak after a full missed day", () => {
    const sessions = [session("2026-09-24", 10), session("2026-09-27", 10)];
    const stats = computeStats(sessions, new Date(2026, 8, 27));
    expect(stats.currentStreak).toBe(1);
  });
});

describe("recordSession + loadSessions", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-stats-"));
  });

  afterEach(() => {
    rmSync(state.root, { recursive: true, force: true });
  });

  it("records under today's date and survives a reload", () => {
    recordSession(25);
    recordSession(5);
    const sessions = loadSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.date).toBe(localDate(new Date()));
    expect(sessions.reduce((sum, s) => sum + s.minutes, 0)).toBe(30);
  });
});
