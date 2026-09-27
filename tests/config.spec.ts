import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ root: "" }));

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return {
    ...actual,
    homedir: () => state.root,
  };
});

import { configDir, loadConfig, resetConfig, saveConfig, updateConfig } from "../src/config.js";

describe("config", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-config-test-"));
  });

  afterEach(() => {
    rmSync(state.root, { recursive: true, force: true });
  });

  it("returns an empty config when no file exists", () => {
    expect(loadConfig()).toEqual({});
  });

  it("creates the .talcli directory on save", () => {
    saveConfig({ name: "Tal" });
    expect(existsSync(configDir())).toBe(true);
    expect(configDir()).toMatch(/[\\/]\.talcli$/);
  });

  it("round-trips saved config values", () => {
    saveConfig({ name: "Tal", focusMinutes: 25 });
    expect(loadConfig()).toEqual({ name: "Tal", focusMinutes: 25 });
  });

  it("merges patches on update", () => {
    saveConfig({ name: "Tal", focusMinutes: 25 });
    const next = updateConfig({ breakMinutes: 5 });
    expect(next).toEqual({ name: "Tal", focusMinutes: 25, breakMinutes: 5 });
    expect(loadConfig().breakMinutes).toBe(5);
  });

  it("falls back to an empty config for corrupted JSON", () => {
    const { mkdirSync } = require("node:fs") as typeof import("node:fs");
    mkdirSync(configDir(), { recursive: true });
    writeFileSync(join(configDir(), "config.json"), "{not json", "utf8");
    expect(loadConfig()).toEqual({});
  });

  it("resetConfig empties the config file", () => {
    saveConfig({ name: "Tal" });
    resetConfig();
    expect(loadConfig()).toEqual({});
    expect(readFileSync(join(configDir(), "config.json"), "utf8").trim()).toBe("{}");
  });
});
