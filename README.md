# TalCLI

[![CI](https://github.com/dinguk0624/TalCLI/actions/workflows/ci.yml/badge.svg)](https://github.com/dinguk0624/TalCLI/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://github.com/dinguk0624/TalCLI)
[![Tests](https://img.shields.io/badge/tests-71%20passing-brightgreen)](./tests)

> ⏳ TalCLI is not yet on npm — install locally with `npm link` (see [Contributing](./CONTRIBUTING.md)). This notice will be replaced by an install command after the first release.

> Your all-in-one chill companion for the terminal. Focus sprints, guided breathing, motivation, and handy dev tools — one short command away.

```text
  ████████╗ █████╗ ██╗ ██████╗██╗     ██╗
  ╚══██╔══╝██╔══██╗██║██╔════╝██║     ██║
     ██║   ███████║██║██║     ██║     ██║
     ██║   ██╔══██║██║██║     ██║     ██║
     ██║   ██║  ██║███████╗╚██████╗███████╗██║
     ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝

  $ tal
  Good evening, Tal. What do you need right now?

  ? Pick a mode
  ❯ Focus sprint — timed deep-work session
    Breathe     — guided breathing break
    Quote       — a spark of motivation
    Chill       — all three, back to back
```

## ✨ Why TalCLI?

Because staying focused shouldn't require five browser tabs. TalCLI lives where you already work — the terminal — and gives you:

- 🎯 **`tal focus`** — guided deep-work sprints with an optional break
- 🌬️ **`tal breathe`** — guided breathing patterns (4-7-8, box, 5-5)
- 💬 **`tal quote`** — a spark of motivation when you need it
- 🧘 **`tal chill`** — the full reset: quote → focus → breathe
- 🧹 **`tal clean`** — safely clear `node_modules`, `dist`, and friends
- ✅ **`tal todo`** — a tiny local task list, no account required
- 📊 **`tal stats`** — focus totals, day streaks, and a 7-day activity chart
- 🌿 **`tal git`** — friendly shortcuts: `wip` checkpoints and safe `undo`
- 🏠 **`tal`** — an interactive home menu, always one keystroke away

No accounts. No telemetry. No cloud. Everything runs locally and your settings live in `~/.talcli`.

## 📦 Install

```bash
npm install -g talcli   # coming with the first npm release
```

Requires Node.js 20 or newer. Until the first release, build from source:

```bash
git clone https://github.com/dinguk0624/TalCLI.git
cd TalCLI
npm install && npm run build && npm link
```

## 🚀 Usage

```bash
tal              # open the interactive home menu
tal init         # set your name and session defaults
tal focus        # start a focus sprint
tal breathe      # 6 presets or build your own rhythm
tal quote        # get a motivational quote
tal chill        # quote → focus → breathe
tal clean        # find and remove disposable folders (has --dry-run)
tal todo         # show your local task list
tal todo add "Ship v0.2"  # add a todo
tal todo done 1 2         # finish todos (--undo reopens)
tal todo clear            # remove completed todos
tal stats        # focus totals, streaks, last 7 days
tal git wip "note"        # stage all + wip checkpoint commit
tal git undo              # revert the last commit (--hard to discard)
tal --help       # every command, at a glance
```

### First run

Run `tal init` once to save your name and defaults (focus length, break length, breathing pattern) to `~/.talcli/config.json`. Every command then adapts to you — or just skip it, TalCLI works out of the box.

## ❓ FAQ

**Where is my data stored?** Everything lives in `~/.talcli/` (`config.json`, `todo.json`, `stats.json`). It is plain JSON, always yours, and nothing ever leaves your machine.

**How do I stop the update check?** Set `TAL_NO_UPDATE_CHECK=1`. The check also stays silent in CI environments and runs at most once per 24 hours.

**Does `tal git undo` lose my work?** By default no — it creates a revert commit, so history stays intact. Only `tal git undo --hard` discards changes, and it asks for confirmation first.

**How do I uninstall?** `npm uninstall -g talcli` removes the command; `rm -rf ~/.talcli` removes all local data.

## 🗺️ Roadmap

- [x] `tal todo` — tiny local task list
- [x] `tal git` — friendly git shortcuts (`wip`, `undo`)
- [x] More breathing patterns and ambient timers
- [x] Session statistics and streaks
- [ ] `tal setup` — scaffold new projects from templates
- [ ] Ambient sounds and themes

Have an idea? [Open a feature request](https://github.com/dinguk0624/TalCLI/issues)!

## 🤝 Contributing

Contributions are very welcome! Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for the setup, and please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating. Good first issues are labeled `good first issue`.

## 📄 License

[MIT](./LICENSE) © TalCLI contributors
