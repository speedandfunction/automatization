import { proxyActivities } from '@temporalio/workflow';

// Example workflow definition
export async function exampleWorkflow(name: string): Promise<string> {
  return `Hello, ${name}!`;
} 