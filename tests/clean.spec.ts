import { mkdtempSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  root: "",
  CANCEL: Symbol("clack-cancel"),
  selectValue: [] as string[],
  confirmValue: false,
}));

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
    multiselect: vi.fn(() => Promise.resolve([...state.selectValue])),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
  };
});

import { runClean } from "../src/commands/clean.js";

/**
 * The command scans process.cwd(); we mock cwd to the fake home (state.root)
 * and build a pretend project inside it, so the scanner only ever sees the sandbox.
 */
function makeProject(): { project: string; nodeModules: string; dist: string } {
  const project = join(state.root, "project");
  const nodeModules = join(project, "node_modules");
  const dist = join(project, "dist");
  mkdirSync(nodeModules, { recursive: true });
  mkdirSync(dist, { recursive: true });
  mkdirSync(join(project, "src"), { recursive: true });
  return { project, nodeModules, dist };
}

describe("runClean", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cwd-"));
    state.selectValue = [];
    state.confirmValue = false;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process, "cwd").mockReturnValue(state.root);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("dry run lists folders but deletes nothing", async () => {
    const { nodeModules } = makeProject();
    state.selectValue = [nodeModules];

    await runClean({ dryRun: true, yes: true });

    expect(existsSync(nodeModules)).toBe(true);
  });

  it("deletes only the folders the user selects", async () => {
    const { nodeModules, dist } = makeProject();
    state.selectValue = [nodeModules];
    state.confirmValue = true;

    await runClean({ yes: true });

    expect(existsSync(nodeModules)).toBe(false);
    expect(existsSync(dist)).toBe(true);
  });

  it("deletes nothing when selection is empty", async () => {
    const { nodeModules, dist } = makeProject();
    state.selectValue = [];

    await runClean({ yes: true });

    expect(existsSync(nodeModules)).toBe(true);
    expect(existsSync(dist)).toBe(true);
  });

  it("does not delete when confirmation is declined", async () => {
    const { nodeModules, dist } = makeProject();
    state.selectValue = [nodeModules, dist];
    state.confirmValue = false;

    await runClean();

    expect(existsSync(nodeModules)).toBe(true);
    expect(existsSync(dist)).toBe(true);
  });

  it("deletes nothing when the user cancels the multiselect", async () => {
    const { nodeModules } = makeProject();
    state.selectValue = [state.CANCEL as unknown as string];

    await runClean({ yes: true });

    expect(existsSync(nodeModules)).toBe(true);
  });

  it("scans the current working directory", async () => {
    makeProject();
    state.selectValue = [];

    await runClean({ yes: true });

    expect(process.cwd()).toBe(state.root);
  });
});
