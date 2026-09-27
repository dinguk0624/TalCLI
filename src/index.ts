import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { runHome } from "./commands/home.js";
import { runInit } from "./commands/init.js";
import { runQuote } from "./commands/quote.js";
import { runFocus } from "./commands/focus.js";
import { runBreathe } from "./commands/breathe.js";
import { runChill } from "./commands/chill.js";
import { runClean } from "./commands/clean.js";
import { runTodoAdd, runTodoClear, runTodoDone, runTodoList } from "./commands/todo.js";

function version(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../package.json");
    const raw = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return raw.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("tal")
  .description("Your all-in-one chill companion for the terminal.")
  .version(version(), "-v, --version", "Show the TalCLI version");

program.action(async () => {
  await runHome();
});

program
  .command("init")
  .description("Set up TalCLI: your name and session defaults")
  .action(async () => {
    await runInit();
  });

program
  .command("quote")
  .description("Show a motivational quote")
  .action(async () => {
    await runQuote();
  });

program
  .command("focus")
  .description("Start a guided focus sprint with an optional break")
  .action(async () => {
    await runFocus();
  });

program
  .command("breathe")
  .description("Take a guided breathing break")
  .action(async () => {
    await runBreathe();
  });

program
  .command("chill")
  .description("The full reset: quote, focus, breathe — back to back")
  .action(async () => {
    await runChill();
  });

program
  .command("clean")
  .description("Find and remove build/dependency folders like node_modules and dist")
  .option("-y, --yes", "Skip the confirmation prompt")
  .option("--dry-run", "Only show what would be deleted")
  .action(async (opts: { yes?: boolean; dryRun?: boolean }) => {
    await runClean(opts);
  });

const todo = program
  .command("todo")
  .description("Manage a tiny local task list (stored in ~/.talcli)");

todo
  .command("add")
  .argument("[text...]")
  .description('Add a todo, e.g. tal todo add "Ship v0.2"')
  .action(async (parts: string[]) => {
    await runTodoAdd(parts);
  });

todo
  .command("done")
  .argument("[ids...]")
  .option("--undo", "Reopen todos instead of finishing them")
  .description("Mark todos as done, e.g. tal todo done 1 2 (--undo to reopen)")
  .action(async (ids: string[], opts: { undo?: boolean }) => {
    await runTodoDone(ids, opts.undo === true);
  });

todo
  .command("clear")
  .option("-y, --yes", "Skip the confirmation prompt")
  .description("Remove all completed todos")
  .action(async (opts: { yes?: boolean }) => {
    await runTodoClear(opts.yes === true);
  });

todo
  .command("list")
  .description("Show all todos")
  .action(async () => {
    await runTodoList();
  });

todo.action(async () => {
  await runTodoList();
});

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
