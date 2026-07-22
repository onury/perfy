import { PerfyError } from './PerfyError.js';

/**
 *  A monotonic, high-resolution clock returning the current reading in whole
 *  nanoseconds as a `BigInt`. Only the *difference* between two readings is
 *  meaningful; the absolute value carries no fixed epoch.
 */
export type NanoClock = () => bigint;

/** Nanoseconds per millisecond — the `performance.now()` (ms) → ns factor. */
const NS_PER_MS = 1_000_000;

/**
 *  Builds a {@link NanoClock} from the given host objects, preferring the most
 *  precise source available:
 *
 *  1. `process.hrtime.bigint()` (Node.js) — exact integer nanoseconds.
 *  2. `performance.now()` (browsers, Deno, Bun, workers) — fractional
 *     milliseconds, rounded up to nanosecond units. Browsers deliberately
 *     coarsen this reading as a timing-attack mitigation.
 *
 *  Passing the host objects in (rather than reading globals directly) keeps the
 *  selection pure and testable.
 *
 *  @param proc - A `process`-like object, or `undefined` outside Node.js.
 *  @param perf - A `performance`-like object, or `undefined` where absent.
 *  @returns A monotonic nanosecond clock.
 *  @throws {PerfyError} `NO_CLOCK` when neither source is available.
 */
export const createNanoClock = (
  proc: typeof globalThis.process | undefined,
  perf: typeof globalThis.performance | undefined
): NanoClock => {
  const hrtime = proc?.hrtime;
  if (hrtime?.bigint) {
    return () => hrtime.bigint();
  }
  if (perf?.now) {
    return () => BigInt(Math.round(perf.now() * NS_PER_MS));
  }
  throw new PerfyError('No high-resolution clock is available in this environment.', 'NO_CLOCK');
};

/** The clock selected from this environment's globals, used by default. */
export const defaultNanoClock: NanoClock = createNanoClock(
  globalThis.process,
  globalThis.performance
);
