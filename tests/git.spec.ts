import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ root: "", CANCEL: Symbol("clack-cancel"), confirmValue: false }));

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir: () => state.root };
});

vi.mock("@clack/prompts", () => {
  const isCancel = (v: unknown): boolean => v === state.CANCEL;
  return {
    isCancel,
    cancel: vi.fn(),
    intro: vi.fn(),
    outro: vi.fn(),
    text: vi.fn(() => Promise.resolve("")),
    select: vi.fn(() => Promise.resolve(undefined)),
    confirm: vi.fn(() => Promise.resolve(state.confirmValue)),
    multiselect: vi.fn(() => Promise.resolve([])),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
  };
});

import { runGitUndo, runGitWip } from "../src/commands/git.js";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "talcli-git-"));
  git(dir, "init", "-b", "main");
  git(dir, "config", "user.email", "test@example.com");
  git(dir, "config", "user.name", "Test");
  git(dir, "config", "core.autocrlf", "false");
  writeFileSync(join(dir, "file.txt"), "one\n", "utf8");
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "initial");
  return dir;
}

describe("tal git wip", () => {
  let repo: string;
  let prevCwd: string;

  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-gitroot-"));
    repo = makeRepo();
    prevCwd = process.cwd();
    vi.spyOn(process, "cwd").mockReturnValue(repo);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(repo, { recursive: true, force: true });
    rmSync(state.root, { recursive: true, force: true });
    void prevCwd;
  });

  it("stages everything and creates a wip commit with a note", async () => {
    writeFileSync(join(repo, "file.txt"), "one\ntwo\n", "utf8");
    writeFileSync(join(repo, "new.txt"), "new\n", "utf8");

    await runGitWip(["progress", "on", "auth"]);

    const subject = git(repo, "log", "-1", "--format=%s").trim();
    expect(subject).toBe("wip: progress on auth");
    expect(git(repo, "status", "--porcelain")).toBe("");
    expect(git(repo, "show", "--stat", "--format=", "HEAD")).toContain("new.txt");
  });

  it("creates a timestamped message when no note is given", async () => {
    writeFileSync(join(repo, "file.txt"), "changed\n", "utf8");
    await runGitWip([]);
    expect(git(repo, "log", "-1", "--format=%s")).toMatch(/^wip: checkpoint /);
  });

  it("commits nothing when the tree is clean", async () => {
    const before = git(repo, "rev-parse", "HEAD");
    await runGitWip([]);
    expect(git(repo, "rev-parse", "HEAD")).toBe(before);
  });
});

describe("tal git undo", () => {
  let repo: string;

  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-gitroot-"));
    repo = makeRepo();
    vi.spyOn(process, "cwd").mockReturnValue(repo);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(repo, { recursive: true, force: true });
    rmSync(state.root, { recursive: true, force: true });
  });

  it("reverts the last commit and keeps history safe", async () => {
    writeFileSync(join(repo, "file.txt"), "one\ntwo\n", "utf8");
    git(repo, "commit", "-am", "add second line");

    await runGitUndo({});

    expect(readFileSync(join(repo, "file.txt"), "utf8")).toBe("one\n");
    expect(git(repo, "log", "--format=%s")).toContain("add second line"); // history intact
  });

  it("--hard removes the commit and the changes after confirmation", async () => {
    writeFileSync(join(repo, "file.txt"), "one\ntwo\n", "utf8");
    git(repo, "commit", "-am", "add second line");
    state.confirmValue = true;

    await runGitUndo({ hard: true });

    expect(readFileSync(join(repo, "file.txt"), "utf8")).toBe("one\n");
    expect(git(repo, "log", "--format=%s")).not.toContain("add second line");
  });

  it("--hard does nothing when confirmation is declined", async () => {
    writeFileSync(join(repo, "file.txt"), "one\ntwo\n", "utf8");
    git(repo, "commit", "-am", "add second line");
    state.confirmValue = false;

    await runGitUndo({ hard: true });

    expect(git(repo, "log", "--format=%s")).toContain("add second line");
  });

  it("refuses to run outside a git repository", async () => {
    vi.restoreAllMocks(); // restore real cwd
    const bare = mkdtempSync(join(tmpdir(), "talcli-nogit-"));
    vi.spyOn(process, "cwd").mockReturnValue(bare);
    const cancelSpy = vi.fn();
    const prompts = await import("@clack/prompts");
    vi.mocked(prompts.cancel).mockImplementation(cancelSpy);

    await runGitWip([]);

    expect(cancelSpy).toHaveBeenCalled();
    rmSync(bare, { recursive: true, force: true });
  });
});
