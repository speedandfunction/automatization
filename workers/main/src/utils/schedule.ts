import { ScheduleClient, Connection } from '@temporalio/client';

/**
 * Ensures that a schedule with the given ID exists in Temporal. If it does not exist, creates it.
 *
 * @param {Connection} connection - The Temporal connection instance.
 * @returns {Promise<void>} Resolves when the schedule is verified or created.
 */
export async function createScheduleIfNotExists(connection: Connection) {
  const scheduleClient = new ScheduleClient({ connection });
  try {
    await scheduleClient.getHandle('example-workflow-hourly').describe();
  } catch (err: any) {
    if (err?.name === 'NotFoundError' || err?.message?.includes('workflow not found')) {
      await scheduleClient.create({
        scheduleId: 'example-workflow-hourly',
        spec: { cronExpressions: ['0 * * * *'] },
        action: {
          type: 'startWorkflow',
          workflowType: 'exampleWorkflow',
          taskQueue: 'main-queue',
          workflowId: 'example-workflow-hourly',
          args: [],
        },
      });
    } else {
      throw err;
    }
  }
} 