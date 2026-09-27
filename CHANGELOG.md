# Changelog

All notable changes to TalCLI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-27

### Added

- `tal` — interactive home menu with every mode one keystroke away, live streak display, and a first-run hint
- `tal init` — first-run onboarding that saves your name and defaults to `~/.talcli`
- `tal focus` — guided focus sprints with a live progress bar, configurable length, optional break, and automatic streak recording
- `tal breathe` — six patterns (4-7-8, 4-4-4, 5-5, 4-6, 6-2-8, 3-3-3) plus a fully custom pattern builder
- `tal quote` — motivational quotes from a curated list
- `tal chill` — the full reset: quote → focus → breathe
- `tal clean` — find and remove disposable folders (`node_modules`, `dist`, `build`, …) with `--dry-run` and `--yes` flags
- `tal todo` — tiny local task list: `add`, `list`, `done` (with `--undo`), `clear`, stored in `~/.talcli/todo.json`
- `tal stats` — focus totals, current/best day streaks, and a 7-day activity chart
- `tal git` — friendly shortcuts: `wip` (stage-all checkpoint commit) and `undo` (safe revert, `--hard` with confirmation)
- Update check — once per 24 hours, silent in CI, fully opt-out via `TAL_NO_UPDATE_CHECK=1`
- Automated release workflow: npm publish + GitHub release on `v*` tags (provenance + tag/version guard)
- 71 tests covering every command (including real temp-repo git integration), TypeScript strict mode, ESLint + Prettier, and a 3-OS × Node 20/22/24 GitHub Actions CI

[Unreleased]: https://github.com/dinguk0624/TalCLI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dinguk0624/TalCLI/releases/tag/v0.1.0
