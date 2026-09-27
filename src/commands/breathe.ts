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
  "4-6": { inhale: 4, hold: 0, exhale: 6, cycles: 6 },
  "6-2-8": { inhale: 6, hold: 2, exhale: 8, cycles: 4 },
  "3-3-3": { inhale: 3, hold: 3, exhale: 3, cycles: 6 },
};

function validateSeconds(raw: string): string | undefined {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isInteger(n) || n < 1 || n > 20) {
    return "Enter whole seconds between 1 and 20.";
  }
  return undefined;
}

function validateHold(raw: string): string | undefined {
  if (raw.trim() === "") return undefined; // hold is optional
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 20) {
    return "Hold must be between 0 and 20 seconds.";
  }
  return undefined;
}

function validateCycles(raw: string): string | undefined {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isInteger(n) || n < 1 || n > 10) {
    return "Enter whole cycles between 1 and 10.";
  }
  return undefined;
}

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

async function promptPattern(): Promise<
  { key: string | undefined; pattern: BreathPattern } | undefined
> {
  const chosen = await prompts.select({
    message: "Pick a breathing pattern",
    options: [
      { value: "4-7-8", label: "4-7-8", hint: "deep relaxation — 4 cycles" },
      { value: "4-4-4", label: "4-4-4 (box)", hint: "steady and calm — 5 cycles" },
      { value: "5-5", label: "5-5", hint: "coherent flow — 6 cycles" },
      { value: "4-6", label: "4-6", hint: "long exhale, quick calm — 6 cycles" },
      { value: "6-2-8", label: "6-2-8", hint: "wind-down, great before sleep — 4 cycles" },
      { value: "3-3-3", hint: "fast reset between tasks — 6 cycles", label: "3-3-3" },
      { value: "custom", label: "Custom", hint: "build your own rhythm" },
    ],
  });
  if (prompts.isCancel(chosen)) {
    prompts.cancel("Breathing cancelled.");
    return undefined;
  }

  if (chosen !== "custom") {
    return { key: chosen, pattern: BREATH_PATTERNS[chosen] ?? BREATH_PATTERNS["4-7-8"]! };
  }

  const inhale = await prompts.text({
    message: "Inhale seconds?",
    placeholder: "4",
    defaultValue: "4",
    validate: validateSeconds,
  });
  if (prompts.isCancel(inhale)) {
    prompts.cancel("Breathing cancelled.");
    return undefined;
  }

  const hold = await prompts.text({
    message: "Hold seconds? (empty for none)",
    placeholder: "4",
    defaultValue: "",
    validate: validateHold,
  });
  if (prompts.isCancel(hold)) {
    prompts.cancel("Breathing cancelled.");
    return undefined;
  }

  const exhale = await prompts.text({
    message: "Exhale seconds?",
    placeholder: "6",
    defaultValue: "6",
    validate: validateSeconds,
  });
  if (prompts.isCancel(exhale)) {
    prompts.cancel("Breathing cancelled.");
    return undefined;
  }

  const cycles = await prompts.text({
    message: "How many cycles?",
    placeholder: "5",
    defaultValue: "5",
    validate: validateCycles,
  });
  if (prompts.isCancel(cycles)) {
    prompts.cancel("Breathing cancelled.");
    return undefined;
  }

  const pattern: BreathPattern = {
    inhale: Number(inhale),
    hold: hold.trim() === "" ? 0 : Number(hold),
    exhale: Number(exhale),
    cycles: Number(cycles),
  };
  return { key: undefined, pattern };
}

export async function runBreathe(_opts: BreatheOptions = {}): Promise<void> {
  const config = loadConfig();
  const result = await promptPattern();
  if (!result) return;

  const { key, pattern } = result;
  if (key !== undefined && config.breathPattern !== key) {
    updateConfig({ breathPattern: key });
  }

  const totalSeconds = (pattern.inhale + pattern.hold + pattern.exhale) * pattern.cycles;
  console.log(pc.dim(`\n    Get comfortable. Follow the words. About ${totalSeconds} seconds.\n`));

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
