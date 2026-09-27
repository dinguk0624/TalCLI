import * as prompts from "@clack/prompts";
import pc from "picocolors";
import { loadTodos, nextId, saveTodos, type Todo } from "../todoStore.js";

function parseIds(raw: string[]): number[] {
  const ids: number[] = [];
  for (const part of raw) {
    const id = Number.parseInt(part, 10);
    if (Number.isInteger(id) && id > 0) {
      ids.push(id);
    }
  }
  return [...new Set(ids)];
}

function render(todo: Todo): string {
  const box = todo.done ? pc.green("[x]") : pc.dim("[ ]");
  const id = pc.dim(String(todo.id).padStart(2, " "));
  const text = todo.done ? pc.dim(pc.strikethrough(todo.text)) : todo.text;
  return `  ${box} ${id}  ${text}`;
}

export async function runTodoList(): Promise<void> {
  const todos = loadTodos();

  if (todos.length === 0) {
    console.log(pc.dim("\n  No todos yet. Add one:\n"));
    console.log(pc.cyan(`    tal todo add "Ship v0.2"\n`));
    return;
  }

  const doneCount = todos.filter((todo) => todo.done).length;
  console.log("");
  for (const todo of todos) {
    console.log(render(todo));
  }
  console.log(
    pc.dim(
      `\n  ${doneCount}/${todos.length} done · add: tal todo add "…" · finish: tal todo done <id>\n`,
    ),
  );
}

export async function runTodoAdd(parts: string[]): Promise<void> {
  let text = parts.join(" ").trim();

  if (!text) {
    const answer = await prompts.text({
      message: "What needs to be done?",
      placeholder: "e.g. write the changelog",
    });
    if (prompts.isCancel(answer)) {
      prompts.cancel("Add cancelled — nothing saved.");
      return;
    }
    text = answer.trim();
  }

  if (!text) {
    prompts.cancel("Empty todo — nothing saved.");
    return;
  }

  const todos = loadTodos();
  todos.push({ id: nextId(todos), text, done: false, createdAt: new Date().toISOString() });
  saveTodos(todos);
  console.log(pc.green(`\n  Added: ${text}\n`));
}

export async function runTodoDone(rawIds: string[], undo: boolean): Promise<void> {
  const ids = parseIds(rawIds);
  if (ids.length === 0) {
    prompts.cancel("No valid ids given. Try: tal todo done 1 2");
    return;
  }

  const todos = loadTodos();
  let changed = 0;
  for (const todo of todos) {
    if (!ids.includes(todo.id)) continue;
    todo.done = !undo;
    changed += 1;
  }

  if (changed === 0) {
    console.log(pc.yellow("\n  No todo matched those ids. Run 'tal todo' to see the list.\n"));
    return;
  }

  saveTodos(todos);
  console.log(pc.green(`\n  ${undo ? "Reopened" : "Finished"} ${changed} todo(s).\n`));
}

export async function runTodoClear(yes: boolean): Promise<void> {
  const todos = loadTodos();
  const remaining = todos.filter((todo) => !todo.done);
  const cleared = todos.length - remaining.length;

  if (cleared === 0) {
    console.log(pc.dim("\n  Nothing to clear — no completed todos.\n"));
    return;
  }

  let confirmed = yes;
  if (!confirmed) {
    const answer = await prompts.confirm({
      message: `Clear ${cleared} completed todo(s)?`,
    });
    confirmed = answer === true;
    if (prompts.isCancel(answer)) confirmed = false;
  }
  if (!confirmed) {
    prompts.cancel("Clear cancelled — nothing deleted.");
    return;
  }

  saveTodos(remaining);
  console.log(pc.green(`\n  Cleared ${cleared} completed todo(s).\n`));
}
