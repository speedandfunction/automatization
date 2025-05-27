import { DefaultLogger, NativeConnection, Worker } from '@temporalio/worker';
import path from 'path';

import { validateEnv } from '../../common/utils';
import * as activities from './activities';
import { temporalConfig } from './configs/temporal';
import { workerConfig } from './configs/worker';

export const logger = new DefaultLogger('ERROR');

validateEnv();

export async function createConnection() {
  return NativeConnection.connect(temporalConfig);
}

export async function createWorker(connection: NativeConnection) {
  const workerOptions = {
    ...workerConfig,
    activities,
    workflowsPath:
      process.env.WORKFLOWS_PATH || path.join(__dirname, './workflows'),
    connection,
  };

  return Worker.create(workerOptions);
}

export async function run(): Promise<void> {
  const connection = await createConnection();

  try {
    const worker = await createWorker(connection);

    await worker.run();
  } catch (err) {
    handleRunError(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export function handleRunError(err: unknown): never {
  logger.error(
    `Error in main worker: ${err instanceof Error ? err.message : String(err)}`,
  );
  setTimeout(() => process.exit(1), 100);
  throw err;
}

export function mainEntry() {
  if (require.main === module) {
    run().catch(handleRunError);
  }
}

mainEntry();

export { temporalConfig };
