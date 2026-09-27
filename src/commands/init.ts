import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { loadConfig, updateConfig, type TalConfig } from "../config.js";
import { displayName } from "../utils.js";

const PATTERNS = ["4-7-8", "4-4-4", "5-5"] as const;

function validateMinutes(raw: string): string | undefined {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(n) || n <= 0 || n > 180) {
    return "Please enter a number between 1 and 180.";
  }
  return undefined;
}

function toMinutes(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 180) : fallback;
}

function cancelled(): void {
  prompts.cancel("Setup cancelled — run 'tal init' anytime.");
}

export async function runInit(): Promise<void> {
  const existing = loadConfig();

  prompts.intro(
    existing.initialized
      ? pc.cyan("Welcome back! Let's update your TalCLI settings.")
      : pc.cyan("Welcome to TalCLI! Let's set things up (takes 20 seconds)."),
  );

  const name = await prompts.text({
    message: "What should I call you?",
    placeholder: "friend",
    defaultValue: "",
  });
  if (prompts.isCancel(name)) return cancelled();

  const focus = await prompts.text({
    message: "Default focus length (minutes)?",
    placeholder: "25",
    defaultValue: "25",
    validate: validateMinutes,
  });
  if (prompts.isCancel(focus)) return cancelled();

  const breakAnswer = await prompts.text({
    message: "Default break length (minutes)?",
    placeholder: "5",
    defaultValue: "5",
    validate: validateMinutes,
  });
  if (prompts.isCancel(breakAnswer)) return cancelled();

  const pattern = await prompts.select({
    message: "Favorite breathing pattern?",
    initialValue:
      existing.breathPattern && (PATTERNS as readonly string[]).includes(existing.breathPattern)
        ? existing.breathPattern
        : "4-7-8",
    options: [
      { value: "4-7-8", label: "4-7-8", hint: "deep relaxation" },
      { value: "4-4-4", label: "4-4-4 (box)", hint: "steady and calm" },
      { value: "5-5", label: "5-5", hint: "simple and quick" },
    ],
  });
  if (prompts.isCancel(pattern)) return cancelled();

  const patch: Partial<TalConfig> = {
    name: name.trim() ? name.trim() : undefined,
    focusMinutes: toMinutes(focus, 25),
    breakMinutes: toMinutes(breakAnswer, 5),
    breathPattern: pattern,
    initialized: true,
  };
  updateConfig(patch);

  prompts.outro(
    pc.green(
      `You're all set, ${displayName(patch.name)}! Try ${pc.cyan("tal focus")} or ${pc.cyan("tal quote")}.`,
    ),
  );
}
