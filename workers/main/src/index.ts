import { DefaultLogger } from '@temporalio/worker';

export const logger = new DefaultLogger('ERROR');

/**
 * Executes the main worker process.
 * @returns {Promise<boolean>} Returns true when the worker completes successfully.
 */
export async function run(): Promise<boolean> {
  return true;
}

export function handleRunError(err: Error): never {
  logger.error(`Unhandled error in main: ${err.message}`);
  setTimeout(() => process.exit(1), 100);
  throw err;
}

run().catch(handleRunError);
