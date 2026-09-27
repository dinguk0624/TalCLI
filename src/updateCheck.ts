import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { configDir } from "./config.js";

const PACKAGE = "talcli";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface UpdateInfo {
  current: string;
  latest: string;
}

interface CacheEntry {
  checkedAt: number;
  latest: string;
}

function cacheFile(): string {
  return join(configDir(), "update-check.json");
}

function shouldSkip(): boolean {
  return (
    process.env.TAL_NO_UPDATE_CHECK === "1" ||
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test"
  );
}

function readCache(): CacheEntry | undefined {
  try {
    if (!existsSync(cacheFile())) return undefined;
    const parsed: unknown = JSON.parse(readFileSync(cacheFile(), "utf8"));
    if (!parsed || typeof parsed !== "object") return undefined;
    const entry = parsed as Partial<CacheEntry>;
    if (typeof entry.checkedAt !== "number" || typeof entry.latest !== "string") return undefined;
    return { checkedAt: entry.checkedAt, latest: entry.latest };
  } catch {
    return undefined;
  }
}

function writeCache(latest: string): void {
  try {
    mkdirSync(configDir(), { recursive: true });
    const entry: CacheEntry = { checkedAt: Date.now(), latest };
    writeFileSync(cacheFile(), JSON.stringify(entry) + "\n", "utf8");
  } catch {
    // cache is best-effort only
  }
}

export async function fetchLatestVersion(timeoutMs = 3000): Promise<string | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://registry.npmjs.org/${PACKAGE}/latest`, {
      signal: controller.signal,
      headers: { accept: "application/vnd.npm.install-v1+json" },
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { version?: unknown };
    if (typeof payload.version !== "string") return undefined;
    return payload.version;
  } catch {
    // offline or blocked — the CLI must never fail because of this
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export function isNewer(current: string, latest: string): boolean {
  const parse = (value: string): number[] =>
    value.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);
  if (lMajor !== cMajor) return lMajor > cMajor;
  if (lMinor !== cMinor) return lMinor > cMinor;
  return lPatch > cPatch;
}

export async function checkForUpdate(current: string): Promise<UpdateInfo | undefined> {
  if (shouldSkip()) return undefined;

  const cache = readCache();
  if (cache && Date.now() - cache.checkedAt < TTL_MS) {
    return isNewer(current, cache.latest) ? { current, latest: cache.latest } : undefined;
  }

  const latest = await fetchLatestVersion();
  if (latest === undefined) return undefined;

  writeCache(latest);
  return isNewer(current, latest) ? { current, latest } : undefined;
}

export function printUpdateNotice(info: UpdateInfo): void {
  console.log(
    `\n  Update available ${pc.cyan(info.current)} → ${pc.green(info.latest)}` +
      pc.dim(" — run ") +
      pc.cyan("npm i -g talcli") +
      pc.dim(" to update.\n"),
  );
}
