export class TargetUnitRepositoryError extends Error {
  public cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'TargetUnitRepositoryError';
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TargetUnitRepositoryError);
    }
  }
}
