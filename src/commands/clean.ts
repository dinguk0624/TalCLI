import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { spinner } from "../banner.js";

/** Folders that are always safe to delete and trivially recreatable. */
export const DISPOSABLE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
]);

export interface FoundDir {
  path: string;
}

/** Scan `root` (max 4 levels deep) for disposable directories. */
export async function findDisposableDirs(root: string, maxDepth = 4): Promise<FoundDir[]> {
  const found: FoundDir[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable or vanished — skip quietly
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".git")) continue;
      const full = join(dir, entry.name);
      if (DISPOSABLE_DIRS.has(entry.name)) {
        found.push({ path: full });
        continue; // don't descend into node_modules
      }
      await walk(full, depth + 1);
    }
  }

  await walk(root, 0);
  return found;
}

export interface CleanOptions {
  yes?: boolean;
  dryRun?: boolean;
}

export async function runClean(opts: CleanOptions = {}): Promise<void> {
  const root = process.cwd();
  const s = spinner("Scanning for disposable folders…");
  s.start();
  const found = await findDisposableDirs(root);
  s.stop();

  if (found.length === 0) {
    console.log(pc.green("\n  Nothing to clean — your workspace is spotless.\n"));
    return;
  }

  console.log(pc.dim(`\n  Found ${found.length} folder(s) in ${root}:\n`));
  for (const dir of found) {
    console.log(`  ${pc.cyan("•")} ${dir.path}`);
  }
  console.log("");

  if (opts.dryRun) {
    console.log(pc.yellow("  Dry run: nothing was deleted.\n"));
    return;
  }

  const selected = await prompts.multiselect({
    message: "Which folders should I delete?",
    options: found.map((dir) => ({ value: dir.path, label: dir.path })),
    required: false,
  });
  if (prompts.isCancel(selected)) {
    prompts.cancel("Clean cancelled — nothing was deleted.");
    return;
  }

  if (selected.length === 0) {
    console.log(pc.dim("\n  Nothing selected. All folders kept.\n"));
    return;
  }

  let confirmed = opts.yes === true;
  if (!confirmed) {
    const answer = await prompts.confirm({
      message: `Delete ${selected.length} folder(s)? This cannot be undone.`,
    });
    confirmed = answer === true;
    if (prompts.isCancel(answer)) confirmed = false;
  }
  if (!confirmed) {
    prompts.cancel("Clean cancelled — nothing was deleted.");
    return;
  }

  const del = spinner(`Deleting ${selected.length} folder(s)…`);
  del.start();
  let failures = 0;
  for (const target of selected) {
    try {
      await rm(target, { recursive: true, force: true });
    } catch {
      failures += 1;
    }
  }
  del.succeed(pc.green(`Deleted ${selected.length - failures} folder(s).`));
  if (failures > 0) {
    console.log(pc.yellow(`  ${failures} folder(s) could not be deleted (locked or in use).`));
  }
  console.log("");
}
