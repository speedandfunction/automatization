import { DefaultLogger } from '@temporalio/worker';

/**
 * Shared logger instance for the worker
 * Using INFO level to capture important operational messages
 * including schedule setup, errors, and warnings
 */
export const logger = new DefaultLogger('INFO');
