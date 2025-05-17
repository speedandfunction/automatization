import { proxyActivities } from '@temporalio/workflow';

export async function exampleWorkflow(name: string): Promise<string> {
  return `Hello, ${name}!`;
}
