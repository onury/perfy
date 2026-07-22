import type { NanoClock } from '../src/clock.js';

/**
 *  A deterministic {@link NanoClock} that returns the given readings in order,
 *  one per call (start consumes the first, end the next).
 */
export const clockOf = (...readings: bigint[]): NanoClock => {
  let i = 0;
  return () => {
    const value = readings[i];
    i += 1;
    return value as bigint;
  };
};
