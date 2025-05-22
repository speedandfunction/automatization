import { DefaultLogger, NativeConnection, Worker } from '@temporalio/worker';

import { logWorkerError, validateEnv } from '../../common/utils';
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
    handleRunError(err as Error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export function handleRunError(err: unknown): never {
  logWorkerError('main', err);
  setTimeout(() => process.exit(1), 100);
  throw err;
}

export function mainEntry() {
  if (require.main === module) {
    run().catch(handleRunError);
  }
}

mainEntry();
