import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ root: "" }));

vi.mock("node:os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:os")>();
  return { ...actual, homedir: () => state.root };
});

import { checkForUpdate, isNewer } from "../src/updateCheck.js";

describe("isNewer", () => {
  it("compares semver components numerically", () => {
    expect(isNewer("0.1.0", "0.1.1")).toBe(true);
    expect(isNewer("0.1.10", "0.2.0")).toBe(true);
    expect(isNewer("0.9.9", "1.0.0")).toBe(true);
    expect(isNewer("1.0.0", "1.0.0")).toBe(false);
    expect(isNewer("1.2.3", "1.2.2")).toBe(false);
    expect(isNewer("2.0.0", "1.9.9")).toBe(false);
  });

  it("treats malformed versions as zero", () => {
    expect(isNewer("0.1.0", "0.1.x")).toBe(false);
    expect(isNewer("x.y.z", "0.0.1")).toBe(true);
  });
});

describe("checkForUpdate", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-update-"));
    originalEnv = { ...process.env };
    delete process.env.CI;
    delete process.env.NODE_ENV;
    delete process.env.TAL_NO_UPDATE_CHECK;
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(state.root, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("skips when TAL_NO_UPDATE_CHECK is set", async () => {
    process.env.TAL_NO_UPDATE_CHECK = "1";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(checkForUpdate("0.1.0")).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("skips in CI environments", async () => {
    process.env.CI = "true";
    vi.stubGlobal("fetch", vi.fn());

    await expect(checkForUpdate("0.1.0")).resolves.toBeUndefined();
  });

  it("parses the registry response and caches it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: "9.9.9" }),
        }),
      ),
    );

    await expect(checkForUpdate("0.1.0")).resolves.toEqual({
      current: "0.1.0",
      latest: "9.9.9",
    });

    const cachePath = join(state.root, ".talcli", "update-check.json");
    expect(existsSync(cachePath)).toBe(true);
    const cache = JSON.parse(readFileSync(cachePath, "utf8")) as { latest: string };
    expect(cache.latest).toBe("9.9.9");
  });

  it("uses the cache within TTL without hitting the network", async () => {
    mkdirSync(join(state.root, ".talcli"), { recursive: true });
    writeFileSync(
      join(state.root, ".talcli", "update-check.json"),
      JSON.stringify({ checkedAt: Date.now(), latest: "9.9.9" }),
      "utf8",
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(checkForUpdate("0.1.0")).resolves.toEqual({
      current: "0.1.0",
      latest: "9.9.9",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("expires the cache after TTL and refetches", async () => {
    mkdirSync(join(state.root, ".talcli"), { recursive: true });
    writeFileSync(
      join(state.root, ".talcli", "update-check.json"),
      JSON.stringify({ checkedAt: Date.now() - 25 * 60 * 60 * 1000, latest: "0.0.1" }),
      "utf8",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version: "0.1.0" }),
        }),
      ),
    );

    await expect(checkForUpdate("0.1.0")).resolves.toBeUndefined();
  });

  it("survives network failures silently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );

    await expect(checkForUpdate("0.1.0")).resolves.toBeUndefined();
  });

  it("survives non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false })),
    );

    await expect(checkForUpdate("0.1.0")).resolves.toBeUndefined();
  });
});
