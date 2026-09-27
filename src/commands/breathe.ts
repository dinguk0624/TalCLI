import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, updateConfig } from "../config.js";
import { sleep } from "../utils.js";

export interface BreatheOptions {
  noBanner?: boolean;
}

export interface BreathPattern {
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
}

export const BREATH_PATTERNS: Record<string, BreathPattern> = {
  "4-7-8": { inhale: 4, hold: 7, exhale: 8, cycles: 4 },
  "4-4-4": { inhale: 4, hold: 4, exhale: 4, cycles: 5 },
  "5-5": { inhale: 5, hold: 0, exhale: 5, cycles: 6 },
};

async function phase(seconds: number, label: string): Promise<void> {
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    process.stdout.write(`\r    ${label} ${pc.dim(`· ${remaining}s`)}   `);
    await sleep(1000);
  }
  process.stdout.write(`\r    ${label} ${pc.dim("· done")}   \n`);
}

async function cycle(pattern: BreathPattern): Promise<void> {
  await phase(pattern.inhale, pc.cyan("Inhale"));
  if (pattern.hold > 0) {
    await phase(pattern.hold, pc.yellow("Hold"));
  }
  await phase(pattern.exhale, pc.blue("Exhale"));
}

export async function runBreathe(opts: BreatheOptions = {}): Promise<void> {
  const config = loadConfig();
  const initial =
    config.breathPattern && BREATH_PATTERNS[config.breathPattern] ? config.breathPattern : "4-7-8";

  const chosen = await prompts.select({
    message: "Pick a breathing pattern",
    initialValue: initial,
    options: [
      { value: "4-7-8", label: "4-7-8", hint: "deep relaxation — 4 cycles" },
      { value: "4-4-4", label: "4-4-4 (box)", hint: "steady and calm — 5 cycles" },
      { value: "5-5", label: "5-5", hint: "simple flow — 6 cycles" },
    ],
  });
  if (prompts.isCancel(chosen)) {
    prompts.cancel("Breathing cancelled.");
    return;
  }

  const pattern = BREATH_PATTERNS[chosen] ?? BREATH_PATTERNS["4-7-8"]!;
  if (config.breathPattern !== chosen) {
    updateConfig({ breathPattern: chosen });
  }

  console.log(pc.dim("\n    Get comfortable. Follow the words. Nothing else matters right now.\n"));

  const onSigint = (): void => {
    console.log(pc.dim("\n\n  Breathing paused. Come back anytime."));
    process.exit(0);
  };
  process.on("SIGINT", onSigint);
  try {
    for (let i = 1; i <= pattern.cycles; i += 1) {
      console.log(pc.dim(`  Cycle ${i}/${pattern.cycles}`));
      await cycle(pattern);
    }
  } finally {
    process.off("SIGINT", onSigint);
  }

  console.log(pc.green("\n  Breathing complete. Notice how you feel.\n"));
}
