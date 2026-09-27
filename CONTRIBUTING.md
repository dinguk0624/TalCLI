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

### A note on `allowScripts` in package.json

You'll find a non-standard `"allowScripts": { "esbuild": true }` field in `package.json`. This is **not** used by the npm CLI itself — it is read by npm builds that ship the `install-scripts` security gate, which blocks install scripts from unreviewed packages. It whitelists `esbuild`'s required postinstall step so `npm install` works out of the box in those environments. If you add a new dependency with an install script, review it before adding it here.

## 🚢 Maintainers: publishing a release

Releases are automated: pushing a tag like `v0.2.0` triggers the [release workflow](./.github/workflows/release.yml), which verifies the tag matches `package.json`, runs typecheck + tests + build, publishes to npm with provenance, and creates the GitHub release.

Manual steps:

1. Update `CHANGELOG.md` and bump the version: `npm version patch|minor|major`
2. Verify the package contents: `npm pack --dry-run` (should contain `dist/` only)
3. Add an [`NPM_TOKEN` secret](https://docs.npmjs.com/creating-and-viewing-access-tokens) to the GitHub repo (an automation token works best)
4. Push the tag: `git push --follow-tags`
5. After the first publish, flip the README install notice to the npm badge

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
