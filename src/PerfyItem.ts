import type { NanoClock } from './clock.js';
import { PerfyError } from './PerfyError.js';
import type { IPerfyResult } from './types/index.js';

const NS_PER_SECOND = 1_000_000_000;
const NS_PER_MS = 1_000_000;

/**
 *  A single named performance instance: it captures a start reading from a
 *  monotonic {@link NanoClock}, then computes the elapsed {@link IPerfyResult}
 *  when ended — or a split when {@link PerfyItem.lap} is called. Instances are
 *  created and managed by {@link Perfy}; you rarely construct one directly.
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
  #lastLapNs = 0n;
  #lastLapTime = 0;

  constructor(name: string, clock: NanoClock, autoDestroy = true) {
    this.name = name;
    this.#clock = clock;
    this.autoDestroy = autoDestroy;
  }

  /** Marks the start reading, resets the lap marker, and clears any previous result. */
  start(): void {
    this.result = null;
    this.#startNs = this.#clock();
    this.#startTime = Date.now();
    this.#lastLapNs = this.#startNs;
    this.#lastLapTime = this.#startTime;
  }

  /**
   *  Computes and stores the total elapsed-time result (from `start` to now).
   *
   *  @returns The elapsed {@link IPerfyResult}.
   *  @throws {PerfyError} `NOT_STARTED` if called before {@link PerfyItem.start}.
   */
  end(): IPerfyResult {
    const startNs = this.#assertStarted();
    const elapsed = this.#clock() - startNs;
    this.result = this.#buildResult(elapsed, this.#startTime, Date.now());
    return this.result;
  }

  /**
   *  Records a split: the elapsed time since the previous lap (or since `start`
   *  for the first lap), then advances the lap marker. The instance keeps
   *  running — {@link PerfyItem.end} still reports the total from `start`.
   *
   *  @returns The split {@link IPerfyResult}.
   *  @throws {PerfyError} `NOT_STARTED` if called before {@link PerfyItem.start}.
   */
  lap(): IPerfyResult {
    this.#assertStarted();
    const nowNs = this.#clock();
    const nowTime = Date.now();
    const result = this.#buildResult(nowNs - this.#lastLapNs, this.#lastLapTime, nowTime);
    this.#lastLapNs = nowNs;
    this.#lastLapTime = nowTime;
    return result;
  }

  #assertStarted(): bigint {
    if (this.#startNs === null) {
      throw new PerfyError('start() must be called before end().', 'NOT_STARTED');
    }
    return this.#startNs;
  }

  #buildResult(elapsed: bigint, startTime: number, endTime: number): IPerfyResult {
    const ns = Number(elapsed);
    const time = Number((ns / NS_PER_SECOND).toFixed(3));
    return {
      name: this.name,
      time,
      milliseconds: ns / NS_PER_MS,
      nanoseconds: ns,
      summary: `${this.name ? `${this.name}: ` : ''}${time} sec.`,
      startTime,
      endTime
    };
  }
}
