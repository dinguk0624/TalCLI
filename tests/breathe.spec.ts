import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  root: "",
  CANCEL: Symbol("clack-cancel"),
  selectQueue: [] as unknown[],
  textQueue: [] as string[],
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
    text: vi.fn(() => Promise.resolve(state.textQueue.shift() ?? "")),
    select: vi.fn(() => Promise.resolve(state.selectQueue.shift())),
    confirm: vi.fn(() => Promise.resolve(false)),
    multiselect: vi.fn(() => Promise.resolve([])),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
  };
});

import { BREATH_PATTERNS, runBreathe } from "../src/commands/breathe.js";
import { loadConfig } from "../src/config.js";

async function runWithTicks(totalSeconds: number, flow: () => Promise<void>): Promise<void> {
  const promise = flow();
  for (let i = 0; i < totalSeconds + 3; i += 1) {
    await vi.advanceTimersByTimeAsync(1000);
  }
  await promise;
}

describe("breathe presets", () => {
  it("knows six patterns with sane values", () => {
    expect(Object.keys(BREATH_PATTERNS)).toEqual([
      "4-7-8",
      "4-4-4",
      "5-5",
      "4-6",
      "6-2-8",
      "3-3-3",
    ]);
    for (const pattern of Object.values(BREATH_PATTERNS)) {
      expect(pattern.inhale).toBeGreaterThan(0);
      expect(pattern.exhale).toBeGreaterThan(0);
      expect(pattern.hold).toBeGreaterThanOrEqual(0);
      expect(pattern.cycles).toBeGreaterThan(0);
    }
  });
});

describe("runBreathe", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-breathe-"));
    state.selectQueue = [];
    state.textQueue = [];
    vi.useFakeTimers();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("runs a preset and remembers the choice", async () => {
    state.selectQueue = ["4-6"]; // 6 cycles x 10s = 60s
    await runWithTicks(60, () => runBreathe({ noBanner: true }));

    expect(logSpy.mock.calls.some((args: unknown[]) => String(args[0]).includes("complete"))).toBe(
      true,
    );

    expect(loadConfig().breathPattern).toBe("4-6");
  });

  it("builds a custom pattern from prompts", async () => {
    state.selectQueue = ["custom"];
    state.textQueue = ["2", "", "4", "3"]; // inhale 2, no hold, exhale 4, 3 cycles = 18s
    await runWithTicks(18, () => runBreathe({ noBanner: true }));

    expect(logSpy.mock.calls.some((args: unknown[]) => String(args[0]).includes("complete"))).toBe(
      true,
    );
    // Custom patterns are not persisted as a preset key.
    expect(loadConfig().breathPattern).toBeUndefined();
  });

  it("does nothing when the pattern select is cancelled", async () => {
    state.selectQueue = [state.CANCEL];
    await runBreathe({ noBanner: true });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
