import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface TalConfig {
  /** Display name used in greetings and focus sessions. */
  name?: string;
  /** Default focus session length in minutes. */
  focusMinutes?: number;
  /** Default break length in minutes. */
  breakMinutes?: number;
  /** Default breathing pattern key, e.g. "4-7-8". */
  breathPattern?: string;
  /** Set once onboarding (tal init) has completed. */
  initialized?: boolean;
}

export function configDir(): string {
  return join(homedir(), ".talcli");
}

function configPath(): string {
  return join(configDir(), "config.json");
}

export function loadConfig(): TalConfig {
  try {
    if (!existsSync(configPath())) return {};
    const raw = readFileSync(configPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as TalConfig;
    }
    return {};
  } catch {
    // A broken config should never brick the CLI — fall back to defaults.
    return {};
  }
}

export function saveConfig(config: TalConfig): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(configPath(), JSON.stringify(config, null, 2) + "\n", "utf8");
}

export function updateConfig(patch: Partial<TalConfig>): TalConfig {
  const next = { ...loadConfig(), ...patch };
  saveConfig(next);
  return next;
}

export function resetConfig(): void {
  const path = configPath();
  if (existsSync(path)) {
    writeFileSync(path, "{}\n", "utf8");
  }
}
