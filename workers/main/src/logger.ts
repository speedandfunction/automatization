import { DefaultLogger } from '@temporalio/worker';

/**
 * Shared logger instance for the worker
 * Using ERROR level to reduce noise in production
 */
export const logger = new DefaultLogger('ERROR');
