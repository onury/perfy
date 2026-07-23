import { describe, expect, it } from 'vitest';
import { createNanoClock, defaultNanoClock } from '../src/clock.js';
import { PerfyError } from '../src/PerfyError.js';

describe('createNanoClock', () => {
  it('prefers process.hrtime.bigint() when available', () => {
    const proc = { hrtime: { bigint: () => 42n } } as unknown as typeof globalThis.process;
    const clock = createNanoClock(proc, { now: () => 1 } as Performance);
    expect(clock()).toBe(42n);
  });

  it('falls back to performance.now() (ms → ns) when hrtime is absent', () => {
    const perf = { now: () => 1.5 } as Performance;
    const clock = createNanoClock(undefined, perf);
    expect(clock()).toBe(1_500_000n);
  });

  it('falls back to performance.now() when hrtime exists but has no bigint()', () => {
    const proc = { hrtime: {} } as unknown as typeof globalThis.process;
    const clock = createNanoClock(proc, { now: () => 2 } as Performance);
    expect(clock()).toBe(2_000_000n);
  });

  it('rounds fractional-nanosecond performance readings to whole ns', () => {
    expect(createNanoClock(undefined, { now: () => 0.0000004 } as Performance)()).toBe(0n);
    expect(createNanoClock(undefined, { now: () => 0.0000006 } as Performance)()).toBe(1n);
  });

  it('throws PerfyError(NO_CLOCK) when no clock source is available', () => {
    expect(() => createNanoClock(undefined, undefined)).toThrowError(PerfyError);
    try {
      createNanoClock({} as typeof globalThis.process, {} as Performance);
      expect.unreachable();
    } catch (err) {
      expect((err as PerfyError).code).toBe('NO_CLOCK');
      expect((err as PerfyError).message).toContain('clock');
    }
  });
});

describe('defaultNanoClock', () => {
  it('resolves to a working monotonic clock in this environment', () => {
    const a = defaultNanoClock();
    const b = defaultNanoClock();
    expect(typeof a).toBe('bigint');
    expect(b).toBeGreaterThanOrEqual(a);
  });
});
