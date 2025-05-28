import { validationResult } from '../configs';

export function validateEnv() {
  if (!validationResult.success) {
    const message = validationResult.error.issues
      .map(
        ({ path, message }) =>
          `Missing or invalid environment variable: ${path.join('.') || '(unknown variable)'} (${message})`,
      )
      .join('\n');

    console.error(message);
    process.exit(1);
  }
}
