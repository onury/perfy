/**
 *  The elapsed-time result returned by {@link Perfy.end} and {@link Perfy.exec}.
 *  Every field is a plain `number`/`string`, so the object is safe to
 *  `JSON.stringify`. The duration is computed internally from an exact integer
 *  nanosecond clock, so `nanoseconds` is exact for any realistic measurement
 *  (values stay well within `Number.MAX_SAFE_INTEGER`, i.e. ~104 days).
 */
export interface IPerfyResult {
  /** Name of the performance instance, or `''` for an unnamed `exec()`. */
  name: string;
  /** Full elapsed time in seconds (float, rounded to 3 decimals). e.g. `1.235` */
  time: number;
  /** Full elapsed time in milliseconds (float). e.g. `1235.125` */
  milliseconds: number;
  /** Full elapsed time in nanoseconds. e.g. `1235125283` */
  nanoseconds: number;
  /** Human-readable shorthand of the elapsed time. e.g. `'metric: 1.235 sec.'` */
  summary: string;
  /** UTC wall-clock time (ms) captured at start, via `Date.now()`. e.g. `1533302465251` */
  startTime: number;
  /** UTC wall-clock time (ms) captured at end, via `Date.now()`. e.g. `1533302466486` */
  endTime: number;
}
