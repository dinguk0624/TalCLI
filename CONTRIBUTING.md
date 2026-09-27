# Contributing to TalCLI

Thanks for your interest in making TalCLI better! This document gets you from clone to contribution.

## 🛠️ Development setup

```bash
git clone https://github.com/dinguk0624/TalCLI.git
cd TalCLI
npm install
```

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run build`     | Bundle the CLI into `dist/`     |
| `npm run dev`       | Rebuild on every change         |
| `npm test`          | Run the test suite              |
| `npm run typecheck` | Strict TypeScript check         |
| `npm run format`    | Format everything with Prettier |
| `npm run lint`      | Check formatting in CI          |

### Trying your changes locally

```bash
npm run build
node dist/index.js --help

# or link it globally so `tal` uses your local build:
npm link
```

## 📝 Guidelines

- **Language**: all code, comments, docs, and commit messages are in English.
- **Style**: run `npm run format` before committing. CI enforces it.
- **Tests**: add or update tests for any behavior change. `npm test` must pass.
- **Type safety**: `npm run typecheck` must pass with zero errors.
- **Commits**: short, imperative subject lines, e.g. `add --dry-run flag to tal clean`.
- **Scope**: keep PRs focused — one feature or fix per pull request.

## 🐛 Reporting bugs

Open an issue with:

1. Your OS, Node version (`node --version`), and TalCLI version
2. The exact command you ran
3. What you expected vs. what happened
4. Terminal output, if relevant

## 💡 Suggesting features

Open an issue starting with "Feature request:" and describe the problem you're trying to solve, not just the solution. Commands should stay small, composable, and chill.

## 📄 License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
