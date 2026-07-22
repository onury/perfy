# perfy

<p align="center">
  <a href="https://github.com/onury/perfy/actions/workflows/ci.yml"><img src="https://github.com/onury/perfy/actions/workflows/ci.yml/badge.svg" alt="build" /></a>
  <a href="#tests--quality"><img src="https://img.shields.io/badge/coverage-100%25-2BB150?logo=vitest&logoColor=%23FDC72B&style=flat" alt="coverage" /></a>
  <a href="https://stryker-mutator.io/docs/"><img src="https://img.shields.io/badge/mutation-100%25-2BB150?style=flat" alt="mutation score" /></a>
  <a href="https://www.npmjs.com/package/perfy"><img src="https://img.shields.io/npm/v/perfy.svg?style=flat&label=&color=%23C6234B&logo=npm" alt="version" /></a>
  <a href="https://www.npmjs.com/package/perfy"><img src="https://img.shields.io/npm/dm/perfy.svg?style=flat&color=2BB150&label=downloads" alt="downloads" /></a>
  <a href="#"><img src="https://img.shields.io/badge/dependencies-0-2BB150?style=flat" alt="zero dependencies" /></a>
  <a href="https://gist.github.com/onury/d3f3d765d7db2e8b2d050d14315f2ac7"><img src="https://img.shields.io/badge/ESM-F7DF1E?style=flat" alt="ESM" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TS-3260C7?style=flat" alt="TS" /></a>
  <a href="https://github.com/onury/perfy/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/perfy.svg?style=flat&color=blue" alt="license" /></a>
</p>

> This module is **ESM** 🔆. Please [**read this**](https://gist.github.com/onury/d3f3d765d7db2e8b2d050d14315f2ac7).

A tiny, **zero-dependency** utility for measuring code execution time in **high-resolution real time** — named timers, one-shot `exec()` wrappers, and a rich elapsed-time result. Runs in **Node.js, browsers, Deno and Bun**.

```ts
import perfy from 'perfy';

perfy.start('loop');
// ...heavy work...
console.log(perfy.end('loop').time); // -> 1.235 (sec.)
```

> [!NOTE]
> Perfy picks the **most precise clock available**: `process.hrtime.bigint()` on Node.js (exact integer nanoseconds), falling back to `performance.now()` elsewhere. The elapsed time is computed with integer-nanosecond math, so it never accumulates floating-point drift. Wall-clock `startTime` / `endTime` stamps come from `Date.now()`.

## Installation

```sh
npm install perfy
```

## Usage

Call `perfy.start('name')` to create a timer and mark its start, then `perfy.end('name')` to get the elapsed-time [result](#the-result-object). By default the instance is destroyed once ended.

```ts
import perfy from 'perfy';

perfy.start('loop-stuff');
// ...some heavy stuff here...
const result = perfy.end('loop-stuff');
console.log(result.time); // -> 1.459 (sec.)
```

...or wrap the work in `exec()` and let Perfy time it for you:

```ts
perfy.exec('async-stuff', (done) => {
  // ...some heavy async stuff here...
  const result = done();
  console.log(result.time); // -> 1.459 (sec.)
});
```

The default export is a shared singleton — the simplest way to use the library. When you want an **isolated registry** (or a custom clock, e.g. in tests), construct your own:

```ts
import { Perfy } from 'perfy';

const perfy = new Perfy();
```

## API

Every method that takes a `name` throws a [`PerfyError`](#errors) with code `NAME_REQUIRED` when it is empty.

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `start(name, autoDestroy?)` | `Perfy` | Creates a new instance under `name` and marks its start time. Reusing a name overwrites it. `autoDestroy` (default `true`) drops the instance when `end()` is called. Chainable. |
| `end(name)` | [`IPerfyResult`](#the-result-object) | Ends the instance and returns the elapsed-time result. If `autoDestroy` was left on, the instance is removed right after. Calling `end()` again on a kept instance returns the same cached result. Throws `NO_INSTANCE` if no such instance exists. |
| `exec([name,] fn)` | [`IPerfyResult`](#the-result-object) \| `Perfy` | Times the execution of `fn`. A **synchronous** `fn` (no argument) is ended automatically and its result returned. An **asynchronous** `fn(done)` must call `done()` to end the timer; `exec` returns the `Perfy` instance immediately. Pass a `name` to keep the instance. Throws `INVALID_CALLBACK` if `fn` is not a function. |
| `result(name)` | [`IPerfyResult`](#the-result-object) \| `null` | The stored result of a kept, ended instance — or `null` if it does not exist or has not ended yet. |
| `exists(name)` | `boolean` | Whether an instance currently exists under `name`. `false` once an auto-destroyed instance has ended. |
| `names()` | `string[]` | Names of all existing instances. |
| `count()` | `number` | Number of existing instances. |
| `destroy(name)` | `Perfy` | Destroys the instance under `name`, if any. Chainable. |
| `destroyAll()` | `Perfy` | Destroys all existing instances. Chainable. |

### The Result Object

`end()` (and `exec()` / `result()`) return an `IPerfyResult` — every field is a plain `number`/`string`, so the object is safe to `JSON.stringify`.

| Property | Type | Description |
| -------- | ---- | ----------- |
| `name` | `string` | Name of the instance (`''` for an unnamed `exec()`). |
| `time` | `number` | Full elapsed time in **seconds** (float, 3 decimals). e.g. `1.235` |
| `milliseconds` | `number` | Full elapsed time in **milliseconds** (float). e.g. `1235.125` |
| `nanoseconds` | `number` | Full elapsed time in **nanoseconds**. e.g. `1235125283` |
| `summary` | `string` | Human-readable shorthand. e.g. `'loop: 1.235 sec.'` |
| `startTime` | `number` | UTC wall-clock time (ms) at start, via `Date.now()`. e.g. `1533302465251` |
| `endTime` | `number` | UTC wall-clock time (ms) at end, via `Date.now()`. e.g. `1533302466486` |

## Examples

**Reading the elapsed time in different units:**

```ts
perfy.start('metric');
// ...
const r = perfy.end('metric');
console.log(`${r.time} sec.`);          // -> 1.234 sec.
console.log(`${r.milliseconds} ms.`);   // -> 1234.567 ms.
console.log(r.summary);                 // -> metric: 1.234 sec.
```

**Auto-destroy (default):**

```ts
perfy.start('metric').count();  // -> 1
perfy.end('metric');
perfy.count();                  // -> 0 (destroyed on end)
```

**Keep the instance (disable `autoDestroy`):**

```ts
perfy.start('metric', false);
perfy.end('metric').time;   // -> 0.123
perfy.exists('metric');     // -> true (kept)
perfy.result('metric');     // -> the same result object
```

**Timing a synchronous function** — `exec()` returns the result directly:

```ts
const result = perfy.exec(() => {
  // sync work
});
console.log(result.time);
```

**Timing an asynchronous function** — call `done()` when finished:

```ts
perfy.exec((done) => {
  setTimeout(() => {
    const result = done();
    console.log(result.time);
  }, 1000);
});
```

**Named `exec()`** keeps the instance for later retrieval:

```ts
perfy.exec('async-op', (done) => {
  done();
});
perfy.exists('async-op');  // -> true
perfy.result('async-op');  // -> the result object
```

**Destroy everything:**

```ts
perfy.destroyAll().count(); // -> 0
```

### Errors

Every failure throws a `PerfyError` — an `Error` subclass carrying a stable, machine-readable `code` (`NAME_REQUIRED`, `NO_INSTANCE`, `NOT_STARTED`, `INVALID_CALLBACK`, `NO_CLOCK`):

```ts
import perfy, { PerfyError } from 'perfy';

try {
  perfy.end('never-started');
} catch (err) {
  if (err instanceof PerfyError && err.code === 'NO_INSTANCE') {
    // handle it
  }
}
```

## Tests & Quality

100% test coverage (statements, branches, functions, lines) and a **100% [Stryker](https://stryker-mutator.io) mutation score**, run across Node.js 22 & 24 in CI.

## Changelog

See [**CHANGELOG.md**](CHANGELOG.md). **v2 is a breaking release** (ESM-only, universal clock, streamlined result object) — the migration notes live there.

## Related

- [**accesscontrol**](https://github.com/onury/accesscontrol) — Role & attribute based access control for Node.js.

## License

© 2026, Onur Yıldırım ([@onury](https://github.com/onury)). [**MIT**](LICENSE) License.
