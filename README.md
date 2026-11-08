# AI Dev Doctor

A small, local, deterministic CLI that checks practical repository hygiene. This initial MVP does **not** call an AI service or read secret-file contents.

## Install

```bash
npm install
```

## Run

Scan the current repository:

```bash
npm run dev -- .
```

Scan another repository or request machine-readable output:

```bash
npm run dev -- ../another-project --json
```

The checks cover README, license, `.gitignore` protections, `package.json` scripts, contribution guidance, and known secret-like file names.

## Test and build

```bash
npm test
npm run build
```

## Status

This is an initial non-AI local analyzer. It reports warnings only and does not inspect Git history, dependency vulnerabilities, code quality, or the contents of possible secret files.

## License

MIT. See [LICENSE](LICENSE).
