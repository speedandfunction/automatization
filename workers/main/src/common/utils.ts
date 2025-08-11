import crypto from 'crypto';

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

/**
 * Generates cryptographically secure random jitter for retry delays
 * @param baseDelay - The base delay in milliseconds
 * @returns A random jitter value between 0 and 10% of the base delay
 */
export function generateJitter(baseDelay: number): number {
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / 0x100000000; // Convert to [0,1) range

  return randomValue * 0.1 * baseDelay;
}
