import { Client } from '@temporalio/client';

import { logger } from '../index';
import { weeklyFinancialReportsWorkflow } from '../workflows';
import { workerConfig } from './worker';

const SCHEDULE_ID = 'weekly-financial-report-schedule';

/**
 * Sets up the weekly financial report schedule
 * Schedule runs every Tuesday at 1 PM America/New_York time (EST/EDT)
 * @param client - Temporal client instance
 */
export async function setupWeeklyReportSchedule(client: Client): Promise<void> {
  try {
    const scheduleHandle = client.schedule.getHandle(SCHEDULE_ID);

    // Check if schedule already exists
    try {
      await scheduleHandle.describe();
      logger.info(`Schedule ${SCHEDULE_ID} already exists, skipping creation`);

      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Schedule doesn't exist, create it
      logger.info(
        `Schedule ${SCHEDULE_ID} not found, creating schedule. Reason: ${errorMessage}`,
      );
    }

    await client.schedule.create({
      scheduleId: SCHEDULE_ID,
      spec: {
        cronExpressions: ['0 13 * * 2'], // Every Tuesday at 1 PM
        timezone: 'America/New_York', // Automatically handles EST/EDT transitions
      },
      action: {
        type: 'startWorkflow',
        workflowType: weeklyFinancialReportsWorkflow,
        taskQueue: workerConfig.taskQueue,
        workflowId: `weekly-financial-report-scheduled`,
      },
      policies: {
        overlap: 'SKIP', // Skip if previous run is still in progress
        catchupWindow: '1 day', // Catch up missed runs within 1 day
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
