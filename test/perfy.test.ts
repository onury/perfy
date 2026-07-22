import { beforeEach, describe, expect, it } from 'vitest';
import { Perfy } from '../src/Perfy.js';
import { PerfyError } from '../src/PerfyError.js';
import { clockOf } from './support.js';

/** Builds a Perfy whose clock returns 0, 1e9, 2e9, ... ns (1s per reading). */
const perfyOf = (readings = 8) =>
  new Perfy(clockOf(...Array.from({ length: readings }, (_, i) => BigInt(i) * 1_000_000_000n)));

const errOf = (fn: () => unknown): PerfyError => {
  try {
    fn();
  } catch (err) {
    return err as PerfyError;
  }
  throw new Error('expected the call to throw');
};

describe('Perfy', () => {
  describe('start / end', () => {
    it('starts an instance and returns the elapsed result on end', () => {
      const perfy = perfyOf();
      expect(perfy.start('a')).toBe(perfy);
      expect(perfy.exists('a')).toBe(true);
      expect(perfy.end('a').time).toBe(1);
    });

    it('auto-destroys the instance on end by default', () => {
      const perfy = perfyOf();
      perfy.start('a');
      perfy.end('a');
      expect(perfy.exists('a')).toBe(false);
      expect(perfy.count()).toBe(0);
    });

    it('keeps the instance on end when autoDestroy is false', () => {
      const perfy = perfyOf();
      perfy.start('a', false);
      perfy.end('a');
      expect(perfy.exists('a')).toBe(true);
    });

    it('returns the cached result when a kept instance is ended again', () => {
      const perfy = perfyOf();
      perfy.start('a', false);
      const first = perfy.end('a');
      const second = perfy.end('a');
      expect(second).toBe(first);
    });

    it('throws NAME_REQUIRED / NO_INSTANCE for bad end() calls', () => {
      const perfy = perfyOf();
      const nameErr = errOf(() => perfy.start(''));
      expect(nameErr.code).toBe('NAME_REQUIRED');
      expect(nameErr.message).toContain('name is required');
      expect(errOf(() => perfy.end('')).code).toBe('NAME_REQUIRED');

      const missingErr = errOf(() => perfy.end('missing'));
      expect(missingErr.code).toBe('NO_INSTANCE');
      expect(missingErr.message).toContain('missing');
    });
  });

  describe('result', () => {
    it('returns null for a missing or not-yet-ended instance, the result once ended', () => {
      const perfy = perfyOf();
      expect(perfy.result('missing')).toBeNull();
      perfy.start('a', false);
      expect(perfy.result('a')).toBeNull();
      const ended = perfy.end('a');
      expect(perfy.result('a')).toBe(ended);
    });

    it('throws NAME_REQUIRED when no name is given', () => {
      expect(errOf(() => perfyOf().result('')).code).toBe('NAME_REQUIRED');
    });
  });

  describe('exists / names / count', () => {
    it('reports existence, names and count of live instances', () => {
      const perfy = perfyOf();
      perfy.start('a', false).start('b', false);
      expect(perfy.exists('a')).toBe(true);
      expect(perfy.exists('c')).toBe(false);
      expect(perfy.names()).toEqual(['a', 'b']);
      expect(perfy.count()).toBe(2);
    });

    it('throws NAME_REQUIRED for exists() without a name', () => {
      expect(errOf(() => perfyOf().exists('')).code).toBe('NAME_REQUIRED');
    });
  });

  describe('destroy / destroyAll', () => {
    it('destroys a single instance and returns this', () => {
      const perfy = perfyOf();
      perfy.start('a', false);
      expect(perfy.destroy('a')).toBe(perfy);
      expect(perfy.exists('a')).toBe(false);
    });

    it('throws NAME_REQUIRED for destroy() without a name', () => {
      expect(errOf(() => perfyOf().destroy('')).code).toBe('NAME_REQUIRED');
    });

    it('destroys all instances and returns this', () => {
      const perfy = perfyOf();
      perfy.start('a', false).start('b', false);
      expect(perfy.destroyAll()).toBe(perfy);
      expect(perfy.count()).toBe(0);
    });
  });

  describe('exec', () => {
    it('times a synchronous task and returns the result', () => {
      const perfy = perfyOf();
      let ran = false;
      const result = perfy.exec(() => {
        ran = true;
      });
      expect(ran).toBe(true);
      expect(result).toEqual(expect.objectContaining({ name: '', time: 1 }));
      expect(perfy.count()).toBe(0);
    });

    it('saves a named synchronous task for later retrieval', () => {
      const perfy = perfyOf();
      const result = perfy.exec('job', () => {});
      expect(result).toEqual(expect.objectContaining({ name: 'job' }));
      expect(perfy.exists('job')).toBe(true);
      expect(perfy.result('job')).toBe(result);
    });

    it('times an asynchronous task, returning this and the result via done()', () => {
      const perfy = perfyOf();
      let result: unknown;
      const returned = perfy.exec((done) => {
        result = done();
      });
      expect(returned).toBe(perfy);
      expect(result).toEqual(expect.objectContaining({ name: '', time: 1 }));
      expect(perfy.count()).toBe(0);
    });

    it('saves a named asynchronous task', () => {
      const perfy = perfyOf();
      perfy.exec('async-job', (done) => {
        done();
      });
      expect(perfy.exists('async-job')).toBe(true);
      expect(perfy.result('async-job')?.name).toBe('async-job');
    });

    it('keeps a saved async instance ended manually before done() (autoDestroy is false)', () => {
      const perfy = perfyOf();
      perfy.exec('async-job', (done) => {
        expect(typeof done).toBe('function'); // never call it — leave the instance in-flight
      });
      expect(perfy.result('async-job')).toBeNull();
      perfy.end('async-job');
      expect(perfy.exists('async-job')).toBe(true);
    });

    it('times a promise-returning task, resolving to the result', async () => {
      const perfy = perfyOf();
      const result = await perfy.exec(async () => {
        await Promise.resolve();
      });
      expect(result).toEqual(expect.objectContaining({ name: '', time: 1 }));
      expect(perfy.count()).toBe(0);
    });

    it('saves a named promise task and ends it only once the promise settles', async () => {
      const perfy = perfyOf();
      const returned = perfy.exec('io', () => Promise.resolve('x'));
      expect(returned).toBeInstanceOf(Promise);
      expect(perfy.result('io')).toBeNull();
      const result = await returned;
      expect(result.name).toBe('io');
      expect(perfy.result('io')).toBe(result);
    });

    it('propagates a rejected promise task without producing a result', async () => {
      const perfy = perfyOf();
      await expect(perfy.exec('io', () => Promise.reject(new Error('boom')))).rejects.toThrow(
        'boom'
      );
      expect(perfy.exists('io')).toBe(true);
      expect(perfy.result('io')).toBeNull();
    });

    it('treats a task returning a non-thenable value as synchronous', () => {
      const perfy = perfyOf();
      const result = perfy.exec(() => ({ notAPromise: true }));
      expect(result).not.toBeInstanceOf(Promise);
      expect(result.time).toBe(1);
    });

    it('throws INVALID_CALLBACK when no task function is given', () => {
      const perfy = perfyOf();
      const err = errOf(() => (perfy.exec as unknown as (n: string) => unknown)('job'));
      expect(err.code).toBe('INVALID_CALLBACK');
      expect(err.message).toContain('callback');
    });

    it('throws NAME_REQUIRED when a named task has an empty name', () => {
      expect(errOf(() => perfyOf().exec('', () => {})).code).toBe('NAME_REQUIRED');
    });
  });

  describe('custom clock isolation', () => {
    let shared: number;

    beforeEach(() => {
      shared = 0;
    });

    it('uses the injected clock for elapsed math', () => {
      const perfy = new Perfy(() => BigInt(shared++) * 500_000_000n);
      perfy.start('a');
      expect(perfy.end('a').milliseconds).toBe(500);
    });
  });
});
