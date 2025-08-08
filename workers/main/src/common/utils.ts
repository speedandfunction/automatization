import { validationResult } from '../configs';

export function validateEnv() {
  if (!validationResult.success) {
    const errorMessage = validationResult.error.issues
      .map(
        ({ path, message }) =>
          `Missing or invalid environment variable: ${path.join('.') || '(unknown variable)'} (${message})`,
      )
      .join('\n');

    console.error(errorMessage);
    process.exit(1);
  }
}

export function formatDateToISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
