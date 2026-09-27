import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { configDir } from "./config.js";

export interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
}

export function todoFile(): string {
  return join(configDir(), "todo.json");
}

export function loadTodos(): Todo[] {
  try {
    if (!existsSync(todoFile())) return [];
    const parsed: unknown = JSON.parse(readFileSync(todoFile(), "utf8"));
    if (!Array.isArray(parsed)) return [];

    const todos: Todo[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const raw = entry as Partial<Todo>;
      if (typeof raw.text !== "string" || raw.text.trim() === "") continue;
      todos.push({
        id: typeof raw.id === "number" && Number.isFinite(raw.id) ? raw.id : todos.length + 1,
        text: raw.text,
        done: raw.done === true,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
      });
    }
    return todos;
  } catch {
    // A broken todo file should never brick the command — start fresh.
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  mkdirSync(configDir(), { recursive: true });
  writeFileSync(todoFile(), JSON.stringify(todos, null, 2) + "\n", "utf8");
}

export function nextId(todos: Todo[]): number {
  return todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
}
