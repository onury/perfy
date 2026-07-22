import { afterEach, describe, expect, it } from 'vitest';
import { createNanoClock, Perfy, PerfyError, PerfyItem, perfy } from '../src/index.js';

afterEach(() => {
  perfy.destroyAll();
});

describe('package exports', () => {
  it('exposes the singleton as a named export', () => {
    expect(perfy).toBeInstanceOf(Perfy);
  });

  it('exposes the classes and clock factory', () => {
    expect(typeof PerfyItem).toBe('function');
    expect(typeof PerfyError).toBe('function');
    expect(typeof createNanoClock).toBe('function');
  });
});

describe('default singleton with the real environment clock', () => {
  it('measures a real elapsed duration', () => {
    perfy.start('real');
    let sum = 0;
    for (let i = 0; i < 1_000_000; i += 1) {
      sum += i;
    }
    const result = perfy.end('real');

    expect(sum).toBeGreaterThan(0);
    expect(result.time).toBeGreaterThanOrEqual(0);
    expect(result.nanoseconds).toBeGreaterThan(0);
    expect(result.milliseconds).toBeCloseTo(result.nanoseconds / 1_000_000, 6);
    expect(result.endTime).toBeGreaterThanOrEqual(result.startTime);
    expect(perfy.exists('real')).toBe(false);
  });
});
