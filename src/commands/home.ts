import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { showBanner, showTip } from "../banner.js";
import { loadConfig } from "../config.js";
import { displayName } from "../utils.js";

type HomeChoice = "focus" | "breathe" | "quote" | "chill" | "exit";

function partOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "late night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export async function runHome(): Promise<void> {
  showBanner();
  const config = loadConfig();
  console.log(
    pc.dim(`Good ${partOfDay()}, ${displayName(config.name)}. What do you need right now?\n`),
  );
  showTip();

  const choice = await prompts.select<HomeChoice>({
    message: "Pick a mode",
    options: [
      { value: "focus", label: "Focus sprint", hint: "timed deep-work session" },
      { value: "breathe", label: "Breathe", hint: "guided breathing break" },
      { value: "quote", label: "Quote", hint: "a spark of motivation" },
      { value: "chill", label: "Chill", hint: "all three, back to back" },
      { value: "exit", label: "Exit", hint: "see you soon" },
    ],
  });

  if (prompts.isCancel(choice) || choice === "exit") {
    console.log(pc.dim("\nTake it easy — see you soon."));
    return;
  }

  if (choice === "focus") {
    const { runFocus } = await import("./focus.js");
    await runFocus({ noBanner: true });
  } else if (choice === "breathe") {
    const { runBreathe } = await import("./breathe.js");
    await runBreathe({ noBanner: true });
  } else if (choice === "quote") {
    const { runQuote } = await import("./quote.js");
    await runQuote({ noBanner: true });
  } else {
    const { runChill } = await import("./chill.js");
    await runChill({ noBanner: true });
  }
}
