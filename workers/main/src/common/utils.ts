import { validationResult } from '../configs';

export const formatValidationIssues = (
  issues: { path: (string | number)[]; message: string }[],
): string =>
  issues
    .map(
      ({ path, message }) =>
        `Missing or invalid environment variable: ${path.join('.') || '(unknown variable)'} (${message})`,
    )
    .join('\n');

export function validateEnv() {
  if (!validationResult.success) {
    console.error(formatValidationIssues(validationResult.error.issues));
    process.exit(1);
  }
}
