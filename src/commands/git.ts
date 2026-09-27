import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as prompts from "@clack/prompts";
import pc from "picocolors";

const run = promisify(execFile);

export interface GitUndoOptions {
  hard?: boolean;
  yes?: boolean;
}

async function insideWorkTree(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await run("git", ["rev-parse", "--is-inside-work-tree"], { cwd });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

function gitError(err: unknown): string {
  const typed = err as { stderr?: string; message?: string };
  return (typed.stderr ?? typed.message ?? "unknown git error").trim();
}

async function lastSubject(cwd: string): Promise<string | undefined> {
  try {
    const { stdout } = await run("git", ["log", "-1", "--format=%s"], { cwd });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

/**
 * Stage every change and create a throwaway "wip:" checkpoint commit.
 * Local convenience only — real commits deserve real messages.
 */
export async function runGitWip(parts: string[]): Promise<void> {
  const cwd = process.cwd();

  if (!(await insideWorkTree(cwd))) {
    prompts.cancel("Not a git repository — run this inside a project.");
    return;
  }

  let status: string;
  try {
    const result = await run("git", ["status", "--porcelain"], { cwd });
    status = result.stdout.trim();
  } catch (err) {
    prompts.cancel(`git status failed:\n${gitError(err)}`);
    return;
  }

  if (status === "") {
    console.log(pc.dim("\n  Working tree clean — nothing to commit.\n"));
    return;
  }

  try {
    await run("git", ["add", "-A"], { cwd });
  } catch (err) {
    prompts.cancel(`git add failed:\n${gitError(err)}`);
    return;
  }

  const message =
    parts.length > 0 ? `wip: ${parts.join(" ")}` : `wip: checkpoint ${new Date().toLocaleString()}`;

  try {
    await run("git", ["commit", "-m", message], { cwd });
  } catch (err) {
    const text = gitError(err);
    if (/nothing to commit|no changes added/i.test(text)) {
      console.log(pc.dim("\n  Nothing staged — no commit created.\n"));
      return;
    }
    prompts.cancel(`git commit failed:\n${text}`);
    return;
  }

  let hash: string;
  try {
    const result = await run("git", ["rev-parse", "--short", "HEAD"], { cwd });
    hash = result.stdout.trim();
  } catch {
    hash = "?";
  }

  console.log(pc.green(`\n  ✓ Committed ${hash} — ${message}`));
  console.log(
    pc.dim("  wip commits are for you, not for history books. Squash or reword before sharing.\n"),
  );
}

/**
 * Undo the last commit. Defaults to a safe revert (history preserved);
 * --hard also discards the changes, after an explicit confirmation.
 */
export async function runGitUndo(opts: GitUndoOptions = {}): Promise<void> {
  const cwd = process.cwd();

  if (!(await insideWorkTree(cwd))) {
    prompts.cancel("Not a git repository — run this inside a project.");
    return;
  }

  const subject = await lastSubject(cwd);
  if (subject === undefined) {
    prompts.cancel("No commits to undo yet.");
    return;
  }

  if (opts.hard === true) {
    let confirmed = opts.yes === true;
    if (!confirmed) {
      const answer = await prompts.confirm({
        message: `Delete the last commit "${subject}" AND its changes permanently?`,
      });
      confirmed = answer === true;
      if (prompts.isCancel(answer)) confirmed = false;
    }
    if (!confirmed) {
      prompts.cancel("Undo cancelled — nothing changed.");
      return;
    }

    try {
      await run("git", ["reset", "--hard", "HEAD~1"], { cwd });
    } catch (err) {
      prompts.cancel(`git reset failed:\n${gitError(err)}`);
      return;
    }
    console.log(pc.yellow(`\n  ✓ Removed last commit: ${subject}`));
    console.log(pc.dim("  The changes are gone from the working tree too.\n"));
    return;
  }

  try {
    await run("git", ["revert", "--no-edit", "HEAD"], { cwd });
  } catch (err) {
    prompts.cancel(
      `git revert failed:\n${gitError(err)}\n\nHint: resolve conflicts or run 'git revert --abort', then try again.`,
    );
    return;
  }
  console.log(pc.green(`\n  ✓ Undone: ${subject}`));
  console.log(pc.dim("  A revert commit was added — history stays honest.\n"));
}
