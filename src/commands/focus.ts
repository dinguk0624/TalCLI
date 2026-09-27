import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { loadConfig } from "../config.js";
import { recordSession } from "../stats.js";
import { displayName, formatClock, sleep } from "../utils.js";
import { spinner } from "../banner.js";

export interface FocusOptions {
  noBanner?: boolean;
}

function bar(fraction: number, width: number): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  const filled = Math.round(clamped * width);
  return `${"█".repeat(filled)}${pc.dim("░".repeat(width - filled))}`;
}

async function countdown(totalSeconds: number, mode: "focus" | "break"): Promise<void> {
  const tag = mode === "focus" ? pc.cyan("focus") : pc.magenta("break");
  const width = 24;
  const s = spinner("");
  s.start();
  let remaining = totalSeconds;
  while (remaining > 0) {
    const elapsed = totalSeconds - remaining;
    s.text =
      `  ${tag} ${pc.dim("·")} ${pc.bold(formatClock(remaining))} ` +
      `${bar(elapsed / totalSeconds, width)}`;
    await sleep(1000);
    remaining -= 1;
  }
  s.stop();
}

export async function runFocus(_opts: FocusOptions = {}): Promise<void> {
  const config = loadConfig();
  const fallbackFocus = config.focusMinutes ?? 25;
  const fallbackBreak = config.breakMinutes ?? 5;

  const minutes = await prompts.text({
    message: "Focus for how many minutes?",
    placeholder: String(fallbackFocus),
    defaultValue: String(fallbackFocus),
  });
  if (prompts.isCancel(minutes)) {
    prompts.cancel("Focus session cancelled.");
    return;
  }

  const goal = await prompts.text({
    message: "What are you focusing on? (optional)",
    placeholder: "e.g. refactor the auth module",
  });
  if (prompts.isCancel(goal)) {
    prompts.cancel("Focus session cancelled.");
    return;
  }

  const mins = Number(minutes);
  const total = Number.isFinite(mins) && mins > 0 ? Math.min(Math.round(mins), 180) : fallbackFocus;
  const totalSeconds = total * 60;

  console.log("");
  if (goal.trim()) {
    console.log(pc.cyan(`  Goal: ${goal.trim()}`));
  }
  console.log(pc.dim(`  ${total} minutes. ${displayName(config.name)}, this is your time. Go.\n`));

  const onSigint = (): void => {
    console.log(pc.dim("\n  Session paused. Come back anytime."));
    process.exit(0);
  };
  process.on("SIGINT", onSigint);
  try {
    await countdown(totalSeconds, "focus");
  } finally {
    process.off("SIGINT", onSigint);
  }

  console.log(pc.green(`\n  Focus sprint complete — ${total} minutes done!`));
  recordSession(total);

  const takeBreak = await prompts.confirm({
    message: `Take a ${fallbackBreak}-minute break now?`,
  });
  if (takeBreak === true) {
    const onSigintBreak = (): void => {
      console.log(pc.dim("\n  Break paused. Come back anytime."));
      process.exit(0);
    };
    process.on("SIGINT", onSigintBreak);
    try {
      await countdown(fallbackBreak * 60, "break");
    } finally {
      process.off("SIGINT", onSigintBreak);
    }
    console.log(pc.green("\n  Break over. Back when you're ready.\n"));
  } else {
    console.log(pc.dim("\n  Nice work. Remember to stretch sometime!\n"));
  }
}
