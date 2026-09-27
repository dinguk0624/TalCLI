import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  root: "",
  CANCEL: Symbol("clack-cancel"),
  textValue: "",
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
    text: vi.fn(() => Promise.resolve(state.textValue)),
    select: vi.fn(() => Promise.resolve(undefined)),
    confirm: vi.fn(() => Promise.resolve(state.confirmValue)),
    multiselect: vi.fn(() => Promise.resolve([])),
    spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
  };
});

import { loadTodos, nextId, saveTodos, type Todo } from "../src/todoStore.js";
import { runTodoAdd, runTodoClear, runTodoDone, runTodoList } from "../src/commands/todo.js";

describe("todoStore", () => {
  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-todo-"));
  });

  afterEach(() => {
    rmSync(state.root, { recursive: true, force: true });
  });

  it("returns an empty list when no file exists", () => {
    expect(loadTodos()).toEqual([]);
  });

  it("round-trips todos through save/load", () => {
    const todos: Todo[] = [
      { id: 1, text: "first", done: false, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: 2, text: "second", done: true, createdAt: "2026-01-02T00:00:00.000Z" },
    ];
    saveTodos(todos);
    expect(loadTodos()).toEqual(todos);
    expect(existsSync(join(state.root, ".talcli", "todo.json"))).toBe(true);
  });

  it("drops invalid entries and keeps valid ones", () => {
    saveTodos([
      { id: 1, text: "keep", done: false, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: 2, text: "   ", done: false, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    // Bypass saveTodos filtering: write raw JSON directly.
    const { mkdirSync, writeFileSync } = require("node:fs") as typeof import("node:fs");
    mkdirSync(join(state.root, ".talcli"), { recursive: true });
    writeFileSync(
      join(state.root, ".talcli", "todo.json"),
      JSON.stringify([{ id: 1, text: "good", done: false }, "junk", null, { text: "" }]),
      "utf8",
    );
    const todos = loadTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0]?.text).toBe("good");
  });

  it("computes the next id as max + 1", () => {
    expect(nextId([])).toBe(1);
    expect(nextId([{ id: 3, text: "a", done: false, createdAt: "" }])).toBe(4);
  });
});

describe("todo commands", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    state.root = mkdtempSync(join(tmpdir(), "talcli-todo-"));
    state.textValue = "";
    state.confirmValue = false;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(state.root, { recursive: true, force: true });
  });

  it("add persists a todo and increments ids", async () => {
    await runTodoAdd(["Ship", "v0.2"]);
    await runTodoAdd(["Write", "docs"]);

    const todos = loadTodos();
    expect(todos).toHaveLength(2);
    expect(todos[0]).toMatchObject({ text: "Ship v0.2", done: false });
    expect(todos[1]?.id).toBe(2);
  });

  it("add with no args prompts interactively", async () => {
    state.textValue = "from prompt";
    await runTodoAdd([]);
    expect(loadTodos()[0]?.text).toBe("from prompt");
  });

  it("add cancels on prompt cancel without saving", async () => {
    state.textValue = state.CANCEL as unknown as string;
    await runTodoAdd([]);
    expect(loadTodos()).toEqual([]);
  });

  it("done marks todos finished and undo reopens them", async () => {
    await runTodoAdd(["a"]);
    await runTodoAdd(["b"]);

    await runTodoDone(["1"], false);
    expect(loadTodos().find((t) => t.id === 1)?.done).toBe(true);

    await runTodoDone(["1"], true);
    expect(loadTodos().find((t) => t.id === 1)?.done).toBe(false);
  });

  it("done accepts multiple ids and ignores duplicates", async () => {
    await runTodoAdd(["a"]);
    await runTodoAdd(["b"]);
    await runTodoAdd(["c"]);

    await runTodoDone(["1", "2", "2"], false);
    const todos = loadTodos();
    expect(todos.filter((t) => t.done)).toHaveLength(2);
  });

  it("done reports when no ids match", async () => {
    await runTodoAdd(["a"]);
    await runTodoDone(["99"], false);
    expect(loadTodos().every((t) => !t.done)).toBe(true);
  });

  it("list prints todos", async () => {
    await runTodoAdd(["first"]);
    logSpy.mockClear();

    await runTodoList();
    expect(logSpy).toHaveBeenCalled();
  });

  it("clear removes only completed todos and respects decline", async () => {
    await runTodoAdd(["keep"]);
    await runTodoAdd(["drop"]);
    await runTodoDone(["2"], false);

    state.confirmValue = false;
    await runTodoClear(false);
    expect(loadTodos()).toHaveLength(2);

    state.confirmValue = true;
    await runTodoClear(false);
    const todos = loadTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0]?.text).toBe("keep");
  });

  it("clear with --yes skips the prompt", async () => {
    await runTodoAdd(["keep"]);
    await runTodoAdd(["drop"]);
    await runTodoDone(["2"], false);

    await runTodoClear(true);
    expect(loadTodos()).toHaveLength(1);
  });
});
