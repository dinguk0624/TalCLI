import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { showBanner, showTip } from "../banner.js";
import { loadConfig } from "../config.js";
import { displayName } from "../utils.js";
import { computeStats, loadSessions } from "../stats.js";

type HomeChoice =
  "focus" | "breathe" | "quote" | "chill" | "todo" | "stats" | "clean" | "git" | "init" | "exit";

function partOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "late night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function streakLine(): string | undefined {
  const sessions = loadSessions();
  if (sessions.length === 0) return undefined;
  const stats = computeStats(sessions);
  const today = stats.todaySessions;
  const todayPart = today > 0 ? `${today} today` : "none yet today";
  return `🔥 ${stats.currentStreak}-day streak · ${todayPart} focused`;
}

export async function runHome(): Promise<void> {
  showBanner();
  const config = loadConfig();

  console.log(
    pc.dim(`Good ${partOfDay()}, ${displayName(config.name)}. What do you need right now?`),
  );
  const streak = streakLine();
  if (streak) {
    console.log(pc.dim(streak));
  }
  if (!config.initialized) {
    console.log(pc.dim(`New here? Run ${pc.cyan("tal init")} to personalize your sessions.`));
  }
  console.log("");
  showTip();

  const choice = await prompts.select<HomeChoice>({
    message: "Pick a mode",
    options: [
      { value: "focus", label: "Focus sprint", hint: "timed deep-work session" },
      { value: "breathe", label: "Breathe", hint: "guided breathing break" },
      { value: "todo", label: "Todos", hint: "your local task list" },
      { value: "stats", label: "Stats", hint: "streaks and focus totals" },
      { value: "quote", label: "Quote", hint: "a spark of motivation" },
      { value: "chill", label: "Chill", hint: "quote, focus, breathe — back to back" },
      { value: "clean", label: "Clean", hint: "clear node_modules and build folders" },
      { value: "git", label: "Git", hint: "wip checkpoint or safe undo" },
      { value: "exit", label: "Exit", hint: "see you soon" },
    ],
  });

  if (prompts.isCancel(choice) || choice === "exit") {
    console.log(pc.dim("\nTake it easy — see you soon."));
    return;
  }

  if (choice === "init") {
    const { runInit } = await import("./init.js");
    await runInit();
    return;
  }
  if (choice === "focus") {
    const { runFocus } = await import("./focus.js");
    await runFocus({ noBanner: true });
    return;
  }
  if (choice === "breathe") {
    const { runBreathe } = await import("./breathe.js");
    await runBreathe({ noBanner: true });
    return;
  }
  if (choice === "quote") {
    const { runQuote } = await import("./quote.js");
    await runQuote({ noBanner: true });
    return;
  }
  if (choice === "chill") {
    const { runChill } = await import("./chill.js");
    await runChill({ noBanner: true });
    return;
  }
  if (choice === "todo") {
    const { runTodoList } = await import("./todo.js");
    await runTodoList();
    return;
  }
  if (choice === "stats") {
    const { runStats } = await import("./stats.js");
    await runStats();
    return;
  }
  if (choice === "clean") {
    const { runClean } = await import("./clean.js");
    await runClean({});
    return;
  }

  // choice === "git"
  const { runGitWip, runGitUndo } = await import("./git.js");
  const gitAction = await prompts.select<"wip" | "undo">({
    message: "Git shortcut",
    options: [
      { value: "wip", label: "WIP checkpoint", hint: "stage all + commit" },
      { value: "undo", label: "Undo last commit", hint: "safe revert" },
    ],
  });
  if (prompts.isCancel(gitAction)) {
    prompts.cancel("Git shortcut cancelled.");
    return;
  }
  if (gitAction === "wip") {
    await runGitWip([]);
  } else {
    await runGitUndo({});
  }
}
