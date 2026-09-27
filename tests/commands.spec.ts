import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  root: "",
  CANCEL: Symbol("clack-cancel"),
  textQueue: [] as string[],
  selectQueue: [] as unknown[],
  confirmQueue: [] as (boolean | symbol)[],
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
    confirm: vi.fn(() => Promise.resolve(state.confirmQueue.shift() ?? false)),
    multiselect: vi.fn(() => Promise.resolve([])),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
  };
});

import { runQuote } from "../src/commands/quote.js";
import { runInit } from "../src/commands/init.js";
import { runFocus } from "../src/commands/focus.js";
import { runBreathe } from "../src/commands/breathe.js";
import { runChill } from "../src/commands/chill.js";
import { configDir, loadConfig } from "../src/config.js";

function configPath(): string {
  return join(configDir(), "config.json");
}

describe("runQuote", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cmd-"));
    state.textQueue = [];
    state.selectQueue = [];
    state.confirmQueue = [];
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("prints a quote", async () => {
    await runQuote({ noBanner: true });
    expect(vi.mocked(console.log)).toHaveBeenCalled();
  });
});

describe("runInit", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cmd-"));
    state.textQueue = [];
    state.selectQueue = [];
    state.confirmQueue = [];
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("saves name, defaults, and initialized flag", async () => {
    state.textQueue = ["Tal", "30", "10"];
    state.selectQueue = ["4-4-4"];
    await runInit();

    expect(existsSync(configPath())).toBe(true);
    const saved = JSON.parse(readFileSync(configPath(), "utf8")) as Record<string, unknown>;
    expect(saved).toEqual({
      name: "Tal",
      focusMinutes: 30,
      breakMinutes: 10,
      breathPattern: "4-4-4",
      initialized: true,
    });
    expect(loadConfig().name).toBe("Tal");
  });

  it("clamps minutes into a sane range", async () => {
    state.textQueue = ["", "999", "-5"];
    state.selectQueue = ["5-5"];
    await runInit();

    const saved = JSON.parse(readFileSync(configPath(), "utf8")) as Record<string, unknown>;
    expect(saved.focusMinutes).toBe(180); // clamped to max
    expect(saved.breakMinutes).toBe(5); // invalid -> fallback default
    expect(saved.breathPattern).toBe("5-5");
  });

  it("aborts without saving when the user cancels", async () => {
    state.textQueue = [state.CANCEL as unknown as string];
    await runInit();
    expect(existsSync(configPath())).toBe(false);
  });
});

describe("runFocus", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cmd-"));
    state.textQueue = [];
    state.selectQueue = [];
    state.confirmQueue = [];
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("runs a 1-minute sprint and skips the break when declined", async () => {
    state.textQueue = ["1", ""];
    state.confirmQueue = [false];

    const promise = runFocus({ noBanner: true });
    // Drive 60 one-second ticks of the focus countdown.
    for (let i = 0; i < 61; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
    }
    await promise;

    expect(
      vi.mocked(console.log).mock.calls.some((args) => String(args[0]).includes("complete")),
    ).toBe(true);
  });
});

describe("runBreathe", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cmd-"));
    state.textQueue = [];
    state.selectQueue = [];
    state.confirmQueue = [];
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("persists the chosen pattern and completes all cycles", async () => {
    state.selectQueue = ["4-4-4"];
    const promise = runBreathe({ noBanner: true });
    // 4-4-4 = 5 cycles x (inhale+hold+exhale=12s) = 60s of phases.
    for (let i = 0; i < 65; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
    }
    await promise;

    expect(loadConfig().breathPattern).toBe("4-4-4");
    expect(
      vi.mocked(console.log).mock.calls.some((args) => String(args[0]).includes("complete")),
    ).toBe(true);
  });
});

describe("runChill", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-cmd-"));
    state.textQueue = [];
    state.selectQueue = [];
    state.confirmQueue = [];
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("runs quote, then a 1-minute focus, then a 5-5 breathing flow", async () => {
    state.textQueue = ["1", ""];
    state.selectQueue = ["5-5"]; // picked by the breathe step inside chill
    state.confirmQueue = [false];

    const promise = runChill({ noBanner: true });
    // focus: 60s + breathe: 6 cycles x 10s = 120s total.
    for (let i = 0; i < 130; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
    }
    await promise;

    const calls = vi.mocked(console.log).mock.calls.map((args) => String(args[0]));
    expect(calls.some((line) => line.includes("Chill mode"))).toBe(true);
    expect(calls.some((line) => line.includes("complete"))).toBe(true);
  });
});
