import { defaultNanoClock, type NanoClock } from './clock.js';
import { PerfyError } from './PerfyError.js';
import { PerfyItem } from './PerfyItem.js';
import type { IPerfyResult } from './types/index.js';

/** Callback handed to a callback-style asynchronous {@link Perfy.exec} task; ends the timer. */
export type DoneFn = () => IPerfyResult;
/** A synchronous task for {@link Perfy.exec} — timed and ended automatically. */
export type SyncTask = () => void;
/** A callback-style asynchronous task for {@link Perfy.exec} — ended by calling `done`. */
export type AsyncTask = (done: DoneFn) => void;
/** A promise-returning task for {@link Perfy.exec} — timed until its promise settles. */
export type PromiseTask = () => PromiseLike<unknown>;
/** Any task accepted by {@link Perfy.exec}. */
export type PerfyTask = SyncTask | AsyncTask | PromiseTask;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as { then?: unknown }).then === 'function';

/**
 *  A registry of named, high-resolution performance timers.
 *
 *  The default export is a shared singleton instance — the common way to use
 *  the library. Construct your own `Perfy` when you want an isolated registry
 *  or a custom clock (e.g. a deterministic clock in tests).
 *
 *  @example
 *  ```ts
 *  import perfy from 'perfy';
 *
 *  perfy.start('loop');
 *  // ...heavy work...
 *  console.log(perfy.end('loop').time); // -> 1.235 (sec.)
 *  ```
 */
export class Perfy {
  readonly #list = new Map<string, PerfyItem>();
  readonly #clock: NanoClock;

  /**
   *  @param clock - Monotonic nanosecond clock to time with. Defaults to the
   *  best clock available in the host environment.
   */
  constructor(clock: NanoClock = defaultNanoClock) {
    this.#clock = clock;
  }

  /**
   *  Creates a new performance instance under `name` and marks its start time.
   *  Reusing an existing name overwrites that instance.
   *
   *  @param name - Unique name for the instance.
   *  @param autoDestroy - Whether the instance is dropped when {@link Perfy.end}
   *  is called. Default: `true`.
   *  @returns This `Perfy` instance, for chaining.
   *  @throws {PerfyError} `NAME_REQUIRED` when `name` is empty.
   */
  start(name: string, autoDestroy = true): this {
    const key = this.#requireName(name);
    const item = new PerfyItem(key, this.#clock, autoDestroy);
    this.#list.set(key, item);
    item.start();
    return this;
  }

  /**
   *  Ends the performance instance `name` and returns its elapsed-time result.
   *  If the instance was started with `autoDestroy` (the default), it is
   *  removed immediately after. Calling `end()` again on a kept instance
   *  returns the same cached result.
   *
   *  @param name - Name of the instance to end.
   *  @returns The elapsed {@link IPerfyResult}.
   *  @throws {PerfyError} `NAME_REQUIRED` when `name` is empty, `NO_INSTANCE`
   *  when no instance exists under `name`.
   */
  end(name: string): IPerfyResult {
    const key = this.#requireName(name);
    const item = this.#list.get(key);
    if (!item) {
      throw new PerfyError(`No performance instance with name: ${key}`, 'NO_INSTANCE');
    }
    if (item.result) {
      return item.result;
    }
    const result = item.end();
    if (item.autoDestroy) {
      this.#list.delete(key);
    }
    return result;
  }

  /**
   *  Returns the computed result of a kept, ended instance, or `null` if it
   *  does not exist or has not ended yet.
   *
   *  @param name - Name of the instance.
   *  @throws {PerfyError} `NAME_REQUIRED` when `name` is empty.
   */
  result(name: string): IPerfyResult | null {
    return this.#list.get(this.#requireName(name))?.result ?? null;
  }

  /**
   *  Whether an instance currently exists under `name`. Returns `false` for an
   *  auto-destroyed instance once {@link Perfy.end} has been called.
   *
   *  @param name - Name of the instance.
   *  @throws {PerfyError} `NAME_REQUIRED` when `name` is empty.
   */
  exists(name: string): boolean {
    return this.#list.has(this.#requireName(name));
  }

  /** Names of all existing instances. */
  names(): string[] {
    return [...this.#list.keys()];
  }

  /** Number of existing instances. */
  count(): number {
    return this.#list.size;
  }

  /**
   *  Destroys the instance `name`, if it exists.
   *
   *  @param name - Name of the instance to destroy.
   *  @returns This `Perfy` instance, for chaining.
   *  @throws {PerfyError} `NAME_REQUIRED` when `name` is empty.
   */
  destroy(name: string): this {
    this.#list.delete(this.#requireName(name));
    return this;
  }

  /**
   *  Destroys all existing instances.
   *
   *  @returns This `Perfy` instance, for chaining.
   */
  destroyAll(): this {
    this.#list.clear();
    return this;
  }

  /**
   *  Times the execution of `task`, starting right before and ending right
   *  after it runs. Perfy picks the mode from the task itself:
   *
   *  - **Synchronous** (returns a non-thenable): ended automatically, its
   *    result returned.
   *  - **Promise-returning**: `exec` awaits the returned promise and resolves
   *    to the result. A rejected promise is propagated (no result is produced).
   *  - **Callback-style** (declares a `done` parameter): must call `done()` to
   *    end the timer and obtain the result; `exec` returns this `Perfy`
   *    instance immediately.
   *
   *  Pass a `name` to keep the instance for later retrieval via
   *  {@link Perfy.result}.
   *
   *  @throws {PerfyError} `INVALID_CALLBACK` when no task function is given,
   *  `NAME_REQUIRED` when a `name` is given but empty.
   */
  exec(task: PromiseTask): Promise<IPerfyResult>;
  exec(task: SyncTask): IPerfyResult;
  exec(task: AsyncTask): this;
  exec(name: string, task: PromiseTask): Promise<IPerfyResult>;
  exec(name: string, task: SyncTask): IPerfyResult;
  exec(name: string, task: AsyncTask): this;
  exec(name: string | PerfyTask, task?: PerfyTask): IPerfyResult | this | Promise<IPerfyResult> {
    let key: string | null;
    let fn: PerfyTask;
    if (typeof name === 'function') {
      fn = name;
      key = null;
    } else if (typeof task === 'function') {
      key = this.#requireName(name);
      fn = task;
    } else {
      throw new PerfyError('A callback function is required.', 'INVALID_CALLBACK');
    }

    const item = new PerfyItem(key ?? '', this.#clock, false);
    if (key !== null) {
      this.#list.set(key, item);
    }
    const done: DoneFn = () => item.end();

    item.start();
    if (fn.length > 0) {
      (fn as AsyncTask)(done);
      return this;
    }
    const returned = (fn as SyncTask | PromiseTask)();
    if (isThenable(returned)) {
      return Promise.resolve(returned).then(done);
    }
    return done();
  }

  #requireName(name: string): string {
    if (!name) {
      throw new PerfyError('A performance instance name is required.', 'NAME_REQUIRED');
    }
    return name;
  }
}

/** Shared singleton `Perfy` registry — the default and simplest way to use the library. */
export const perfy = new Perfy();
