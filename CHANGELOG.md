# Perfy - Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## 2.0.0 (2026-07-23)

A ground-up modernization. Perfy is now written in **TypeScript**, ships as **ESM**, and runs **everywhere** — Node.js, browsers, Deno and Bun. This is a **breaking** release; see the migration notes below.

### Added

- **Universal high-resolution clock.** Perfy now picks the most precise clock available: `process.hrtime.bigint()` on Node.js (exact integer nanoseconds), falling back to `performance.now()` in browsers, Deno, Bun and workers. Elapsed time is computed with integer-nanosecond math, so it no longer accumulates floating-point drift. This resolves the long-standing browser-support request.
- **Async/await support in `exec()`.** A task that returns a promise is now awaited, and `exec` resolves to the result: `const r = await perfy.exec('io', async () => { await work(); });`. The callback (`done`) form and synchronous form still work unchanged.
- **First-class TypeScript types**, including the `IPerfyResult` contract, bundled with the package.
- **`Perfy` class** — construct your own isolated registry with `new Perfy()`, instead of only the shared singleton. Optionally inject a custom `NanoClock` (handy for deterministic tests).
- **`PerfyError`** — every failure now throws a typed error carrying a stable, machine-readable `code`: `NAME_REQUIRED`, `NO_INSTANCE`, `NOT_STARTED`, `INVALID_CALLBACK`, `NO_CLOCK`.
- **Named exports** — `perfy` (the singleton, also the default export), `Perfy`, `PerfyItem`, `PerfyError`, `createNanoClock`, `defaultNanoClock`, and all types.

### Changed

- **ESM-only.** The package is now `"type": "module"` and exposes only an ESM entry.
- **Errors** are now `PerfyError` instances (still `instanceof Error`), with clearer messages.

### Removed

- The redundant result aliases `fullSeconds`, `fullMilliseconds` and `fullNanoseconds`, and the `seconds` field.

### Breaking

- **CommonJS `require('perfy')` is gone.** Import it instead:
  ```diff
  - const perfy = require('perfy');
  + import perfy from 'perfy';
  ```
- **Node.js ≥ 22** is required (older runtimes and browsers work via the `performance.now()` fallback).
- **The result object was streamlined.** `time`, `summary`, `startTime` and `endTime` are unchanged. The unit fields now always report the **total** elapsed time (they previously reported only the sub-second portion), and the `full*` aliases were dropped:

  | v1.x | v2.0 | Notes |
  | ---- | ---- | ----- |
  | `time`, `fullSeconds` | `time` | Unchanged; `fullSeconds` alias removed |
  | `fullMilliseconds` | `milliseconds` | `milliseconds` now means **total** ms (was the sub-second portion) |
  | `fullNanoseconds` | `nanoseconds` | `nanoseconds` now means **total** ns (was the sub-second portion) |
  | `seconds` | — | Removed; use `time` |

### Tooling

- Migrated the build to `tsc` → `lib/` (no bundler), linting/formatting to **Biome**, and tests to **Vitest** with **100% coverage** (statements, branches, functions, lines) plus a **100% Stryker mutation score**.
- CI runs on Node.js 22 & 24.

## 1.1.5 (2018-08-03)

### Added

- `fullMilliseconds` on the result object ([#2](https://github.com/onury/perfy/pull/2) by [@anho](https://github.com/anho)).
- `fullNanoseconds` and `fullSeconds` (alias of `time`) on the result object.

### Tooling

- Removed grunt in favour of npm scripts.

## 1.1.2 (2016-03-23)

### Fixed

- `time` and `summary` padding issue ([#1](https://github.com/onury/perfy/pull/1) by [@gunnarlium](https://github.com/gunnarlium)).

## 1.1.0 (2015-10-16)

### Added

- `.exec()` convenience method.

### Changed

- `.exists()` throws when no `name` is specified.

## 1.0.1 (2015-10-12)

### Fixed

- `.result(name)` returns `null` (instead of throwing) when the instance does not exist. It still throws when no name is specified.

## 1.0.0 (2015-10-12)

- First release.
