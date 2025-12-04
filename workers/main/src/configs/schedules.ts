import { Client } from '@temporalio/client';

import { logger } from '../logger';
import { workerConfig } from './worker';

const SCHEDULE_ID = 'weekly-financial-report-schedule';

/**
 * Checks if an error is a "not found" error
 */
function validateIsScheduleNotFoundError(error: unknown): boolean {
  return (
    (error as { code?: number }).code === 5 ||
    (error instanceof Error &&
      error.message.toLowerCase().includes('not found'))
  );
}

/**
 * Checks if schedule exists, returns true if it exists
 */
async function validateScheduleExists(client: Client): Promise<boolean> {
  try {
    const scheduleHandle = client.schedule.getHandle(SCHEDULE_ID);

    await scheduleHandle.describe();
    logger.info(`Schedule ${SCHEDULE_ID} already exists, skipping creation`);

    return true;
  } catch (error) {
    if (!validateIsScheduleNotFoundError(error)) {
      throw error;
    }
    logger.info(`Schedule ${SCHEDULE_ID} not found, creating new schedule`);

    return false;
  }
}

/**
 * Sets up the weekly financial report schedule
 * Schedule runs every Tuesday at 1 PM America/New_York time (EST/EDT)
 * @param client - Temporal client instance
 */
export async function setupWeeklyReportSchedule(client: Client): Promise<void> {
  try {
    const isScheduleExists = await validateScheduleExists(client);

    if (isScheduleExists) {
      return;
    }

    await client.schedule.create({
      scheduleId: SCHEDULE_ID,
      spec: {
        cronExpressions: ['0 13 * * 2'],
        timezone: 'America/New_York',
      },
      action: {
        type: 'startWorkflow',
        workflowType: 'weeklyFinancialReportsWorkflow',
        taskQueue: workerConfig.taskQueue,
        workflowId: `weekly-financial-report-scheduled`,
      },
      policies: {
        overlap: 'SKIP',
        catchupWindow: '1 day',
      },
    });

    logger.info(
      `Successfully created schedule ${SCHEDULE_ID} for weekly financial reports`,
    );
  } catch (error) {
    logger.error(
      `Failed to setup schedule ${SCHEDULE_ID}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/**
 * Schedule configuration exported for documentation and testing
 */
export const scheduleConfig = {
  scheduleId: SCHEDULE_ID,
  cronExpression: '0 13 * * 2',
  timezone: 'America/New_York',
  description: 'Runs every Tuesday at 1 PM EST/EDT',
} as const;
