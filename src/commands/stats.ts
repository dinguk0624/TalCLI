import pc from "picocolors";
import { computeStats, loadSessions, localDate, shiftDate } from "../stats.js";

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

export async function runStats(): Promise<void> {
  const sessions = loadSessions();

  if (sessions.length === 0) {
    console.log(
      pc.dim("\n  No focus sessions yet — ") +
        pc.cyan("tal focus") +
        pc.dim(" starts your first one.\n"),
    );
    return;
  }

  const stats = computeStats(sessions);

  console.log(pc.bold("\n  Focus stats\n"));
  console.log(
    `  Sessions     ${pc.cyan(String(stats.totalSessions))}` +
      `   ·   Time focused   ${pc.cyan(formatMinutes(stats.totalMinutes))}`,
  );
  console.log(
    `  Streak       ${pc.cyan(`🔥 ${stats.currentStreak} ${plural(stats.currentStreak, "day")}`)}` +
      `   ·   Best          ${pc.cyan(`${stats.bestStreak} ${plural(stats.bestStreak, "day")}`)}`,
  );
  console.log(
    `  Today        ${pc.cyan(String(stats.todaySessions))} ${plural(stats.todaySessions, "session")}` +
      ` · ${formatMinutes(stats.todayMinutes)}\n`,
  );

  console.log(pc.dim("  Last 7 days"));
  const today = localDate(new Date());
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = shiftDate(today, -offset);
    const bucket = stats.perDate.get(date);
    const count = bucket?.sessions ?? 0;
    const bar = count > 0 ? pc.cyan("▇".repeat(Math.min(count, 14))) : pc.dim("·");
    console.log(
      `  ${pc.dim(date.slice(5))}  ${bar}${count > 0 ? ` ${pc.dim(String(count))}` : ""}`,
    );
  }
  console.log(pc.dim("\n  Every session is stored locally in ~/.talcli — private by design.\n"));
}
