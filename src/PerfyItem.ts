import type { NanoClock } from './clock.js';
import { PerfyError } from './PerfyError.js';
import type { IPerfyResult } from './types/index.js';

const NS_PER_SECOND = 1_000_000_000;
const NS_PER_MS = 1_000_000;

/**
 *  A single named performance instance: it captures a start reading from a
 *  monotonic {@link NanoClock}, then computes the elapsed {@link IPerfyResult}
 *  when ended. Instances are created and managed by {@link Perfy}; you rarely
 *  construct one directly.
 */
export class PerfyItem {
  /** The name this instance was created with (`''` for unnamed `exec()`). */
  readonly name: string;
  /** Whether {@link Perfy} should drop this instance once ended. */
  autoDestroy: boolean;
  /** The computed result, or `null` until {@link PerfyItem.end} is called. */
  result: IPerfyResult | null = null;

  readonly #clock: NanoClock;
  #startNs: bigint | null = null;
  #startTime = 0;

  constructor(name: string, clock: NanoClock, autoDestroy = true) {
    this.name = name;
    this.#clock = clock;
    this.autoDestroy = autoDestroy;
  }

  /** Marks the start reading and clears any previous result. */
  start(): void {
    this.result = null;
    this.#startNs = this.#clock();
    this.#startTime = Date.now();
  }

  /**
   *  Computes and stores the elapsed-time result.
   *
   *  @returns The elapsed {@link IPerfyResult}.
   *  @throws {PerfyError} `NOT_STARTED` if called before {@link PerfyItem.start}.
   */
  end(): IPerfyResult {
    if (this.#startNs === null) {
      throw new PerfyError('start() must be called before end().', 'NOT_STARTED');
    }
    const elapsed = this.#clock() - this.#startNs;
    const endTime = Date.now();
    const ns = Number(elapsed);
    const time = Number((ns / NS_PER_SECOND).toFixed(3));

    this.result = {
      name: this.name,
      time,
      milliseconds: ns / NS_PER_MS,
      nanoseconds: ns,
      summary: `${this.name ? `${this.name}: ` : ''}${time} sec.`,
      startTime: this.#startTime,
      endTime
    };
    return this.result;
  }
}
