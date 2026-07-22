import { describe, expect, it } from 'vitest';
import { PerfyError } from '../src/PerfyError.js';

describe('PerfyError', () => {
  it('is an Error carrying a message, name and code', () => {
    const err = new PerfyError('boom', 'NAME_REQUIRED');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(err.name).toBe('PerfyError');
    expect(err.code).toBe('NAME_REQUIRED');
  });
});
