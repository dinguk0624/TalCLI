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

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
