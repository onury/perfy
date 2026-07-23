/**
 *  Error codes attached to every {@link PerfyError} thrown by the library, so
 *  callers can branch on `error.code` instead of matching message strings.
 */
export type PerfyErrorCode =
  | 'NAME_REQUIRED'
  | 'NO_INSTANCE'
  | 'NOT_STARTED'
  | 'INVALID_CALLBACK'
  | 'NO_CLOCK';

/**
 *  Error thrown by Perfy for every failure case, carrying a stable
 *  machine-readable {@link PerfyErrorCode} alongside the human-readable message.
 *
 *  @example
 *  ```ts
 *  import { perfy, PerfyError } from 'perfy';
 *
 *  try {
 *    perfy.end('never-started');
 *  } catch (err) {
 *    if (err instanceof PerfyError && err.code === 'NO_INSTANCE') {
 *      // handle the missing instance
 *    }
 *  }
 *  ```
 */
export class PerfyError extends Error {
  /** Stable, machine-readable identifier for the failure case. */
  readonly code: PerfyErrorCode;

  constructor(message: string, code: PerfyErrorCode) {
    super(message);
    this.name = 'PerfyError';
    this.code = code;
  }
}
