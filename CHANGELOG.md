# Changelog

All notable changes to TalCLI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `tal todo` — tiny local task list: `add`, `list`, `done` (with `--undo`), `clear`, stored in `~/.talcli/todo.json`
- Release workflow: automated npm publish + GitHub release on `v*` tags (with provenance and tag/version guard)
- Command-level test coverage: `init`, `quote`, `focus`, `breathe`, `chill`, `clean`, and `todo` (42 tests total)
- Maintainer publishing checklist in CONTRIBUTING.md

### Fixed

- CI matrix now tests Node 20/22/24 — vitest 5 requires Node >= 20.19, which made the Node 18 jobs fail
- `engines` raised to Node >= 20 to match the verified toolchain
- README: npm badge replaced with an honest pre-release notice until the first publish

## [0.1.0] - 2026-09-27

### Added

- `tal` — interactive home menu with focus, breathe, quote, and chill modes
- `tal init` — first-run onboarding that saves your name and defaults to `~/.talcli`
- `tal focus` — guided focus sprints with a configurable length and optional break
- `tal breathe` — guided breathing with 4-7-8, 4-4-4 (box), and 5-5 patterns
- `tal quote` — motivational quotes from a curated list
- `tal chill` — the full reset: quote → focus → breathe
- `tal clean` — find and remove disposable folders (`node_modules`, `dist`, `build`, …) with `--dry-run` and `--yes` flags
- `~/.talcli/config.json` persistence with graceful fallbacks
- Test suite (Vitest), TypeScript strict mode, Prettier, and GitHub Actions CI

[Unreleased]: https://github.com/dinguk0624/TalCLI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dinguk0624/TalCLI/releases/tag/v0.1.0
