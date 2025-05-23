import { validationResult } from '../main/src/configs';
import {logger} from "../main";

export const formatValidationIssues = (issues: { path: (string | number)[]; message: string }[]): string =>
  issues
    .map(({ path, message }) => `Missing or invalid environment variable: ${path.join('.') || '(unknown variable)'} (${message})`)
    .join('\n');

export function validateEnv() {
  if (!validationResult.success) {
    console.error(formatValidationIssues(validationResult.error.issues));
    process.exit(1);
  }
}

/**
 * Logs a worker error in a consistent format.
 * @param workerName - The name of the workflow
 * @param error - The error object
 */
export function logWorkerError(workerName: string, error: unknown) {
  logger.error(
    `Error in ${workerName} workerName: ${error instanceof Error ? error.message : String(error)}`,
  );
}
