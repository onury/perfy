import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerfyError } from '../src/PerfyError.js';
import { PerfyItem } from '../src/PerfyItem.js';
import { clockOf } from './support.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PerfyItem', () => {
  it('defaults autoDestroy to true', () => {
    expect(new PerfyItem('x', clockOf(0n)).autoDestroy).toBe(true);
    expect(new PerfyItem('x', clockOf(0n), false).autoDestroy).toBe(false);
  });

  it('throws PerfyError(NOT_STARTED) when ended before started', () => {
    const item = new PerfyItem('x', clockOf(0n));
    try {
      item.end();
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(PerfyError);
      expect((err as PerfyError).code).toBe('NOT_STARTED');
      expect((err as PerfyError).message).toContain('start()');
    }
  });

  it('computes the elapsed result from the nanosecond clock and wall clock', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    const item = new PerfyItem('metric', clockOf(500n, 500n + 1_235_125_283n));
    item.start();
    const result = item.end();

    expect(result).toEqual({
      name: 'metric',
      time: 1.235,
      milliseconds: 1235.125283,
      nanoseconds: 1235125283,
      summary: 'metric: 1.235 sec.',
      startTime: 1000,
      endTime: 2000
    });
    expect(item.result).toBe(result);
  });

  it('omits the name prefix from the summary for an unnamed item', () => {
    const item = new PerfyItem('', clockOf(0n, 500_000_000n));
    item.start();
    expect(item.end().summary).toBe('0.5 sec.');
  });

  it('clears the previous result when re-started', () => {
    const item = new PerfyItem('x', clockOf(0n, 1_000_000_000n, 5n));
    item.start();
    item.end();
    expect(item.result).not.toBeNull();
    item.start();
    expect(item.result).toBeNull();
  });
});
