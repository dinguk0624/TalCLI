# Changelog

All notable changes to TalCLI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `tal stats` — focus totals, current/best day streaks, and a 7-day activity chart; every completed focus sprint is recorded automatically
- `tal git` — friendly git shortcuts: `wip` (stage-all checkpoint commit) and `undo` (safe revert, `--hard` with confirmation)
- `tal breathe` — three new patterns (`4-6`, `6-2-8`, `3-3-3`) and a fully custom pattern builder
- ESLint (typescript-eslint) alongside Prettier, wired into CI

### Changed

- CI now runs ESLint and Prettier as separate gates on the 3-OS × Node 20/22/24 matrix
- Test suite grown to 62 tests, including real temp-repo git integration tests

## [0.1.0] - 2026-09-27

### Added

- `tal` — interactive home menu with focus, breathe, quote, and chill modes
- `tal init` — first-run onboarding that saves your name and defaults to `~/.talcli`
- `tal focus` — guided focus sprints with a configurable length and optional break
- `tal breathe` — guided breathing with 4-7-8, 4-4-4 (box), and 5-5 patterns
- `tal quote` — motivational quotes from a curated list
- `tal chill` — the full reset: quote → focus → breathe
- `tal clean` — find and remove disposable folders (`node_modules`, `dist`, `build`, …) with `--dry-run` and `--yes` flags
- `tal todo` — tiny local task list: `add`, `list`, `done` (with `--undo`), `clear`, stored in `~/.talcli/todo.json`
- Automated release workflow: npm publish + GitHub release on `v*` tags (provenance + tag/version guard)
- Command-level test coverage for every command, TypeScript strict mode, Prettier, and GitHub Actions CI

[Unreleased]: https://github.com/dinguk0624/TalCLI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dinguk0624/TalCLI/releases/tag/v0.1.0
