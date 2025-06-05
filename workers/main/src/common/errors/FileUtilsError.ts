export class FileUtilsError extends Error {
  public cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FileUtilsError';
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileUtilsError);
    }
  }
}
