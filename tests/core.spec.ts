import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { displayName, formatClock } from "../src/utils.js";
import { pickQuote, QUOTES } from "../src/quotes.js";
import { DISPOSABLE_DIRS, findDisposableDirs } from "../src/commands/clean.js";

describe("displayName", () => {
  it("falls back to friend for empty names", () => {
    expect(displayName(undefined)).toBe("friend");
    expect(displayName("")).toBe("friend");
    expect(displayName("   ")).toBe("friend");
  });

  it("uses the trimmed name when provided", () => {
    expect(displayName(" Tal ")).toBe("Tal");
  });
});

describe("formatClock", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(601)).toBe("10:01");
  });

  it("never goes negative", () => {
    expect(formatClock(-5)).toBe("00:00");
  });
});

describe("quotes", () => {
  it("has a non-empty curated list", () => {
    expect(QUOTES.length).toBeGreaterThan(5);
    for (const quote of QUOTES) {
      expect(quote.text.length).toBeGreaterThan(0);
      expect(quote.author.length).toBeGreaterThan(0);
    }
  });

  it("returns a deterministic quote for a preferred index", () => {
    expect(pickQuote(0)).toEqual(QUOTES[0]);
    expect(pickQuote(QUOTES.length + 3)).not.toBeUndefined();
  });

  it("returns a quote from the list for random picks", () => {
    expect(QUOTES).toContain(pickQuote());
  });
});

describe("findDisposableDirs", () => {
  let root: string;

  beforeEach(() => {
    root = join(tmpdir(), `talcli-clean-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(root, "node_modules", "some-pkg"), { recursive: true });
    mkdirSync(join(root, "src", "dist"), { recursive: true });
    mkdirSync(join(root, "src", "deep", "out"), { recursive: true });
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(join(root, ".git", "config"), "", "utf8");
    // Beyond the depth limit: must NOT be found.
    mkdirSync(join(root, "docs", "a", "b", "c", "d", "node_modules"), { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("knows the usual disposable folder names", () => {
    expect(DISPOSABLE_DIRS.has("node_modules")).toBe(true);
    expect(DISPOSABLE_DIRS.has("dist")).toBe(true);
    expect(DISPOSABLE_DIRS.has(".next")).toBe(true);
    expect(DISPOSABLE_DIRS.has("src")).toBe(false);
  });

  it("finds disposable folders within the depth limit", async () => {
    const found = (await findDisposableDirs(root)).map((d) => d.path).sort();
    const expected = [
      join(root, "node_modules"),
      join(root, "src", "deep", "out"),
      join(root, "src", "dist"),
    ].sort();
    expect(found).toEqual(expected);
  });

  it("skips .git directories entirely", async () => {
    const paths = (await findDisposableDirs(root)).map((d) => d.path);
    expect(paths.some((p) => p.includes(".git"))).toBe(false);
  });
});
