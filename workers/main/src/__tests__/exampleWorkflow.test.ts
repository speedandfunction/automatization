import { describe, it, expect } from 'vitest';
import { exampleWorkflow } from '../workflows/exampleWorkflow';

describe('exampleWorkflow', () => {
  it('should greet the provided name', async () => {
    const result = await exampleWorkflow('Alice');
    expect(result).toBe('Hello, Alice!');
  });

  it('should handle empty string as name', async () => {
    const result = await exampleWorkflow('');
    expect(result).toBe('Hello, !');
  });

  it('should handle special characters in name', async () => {
    const result = await exampleWorkflow('Bob!@#');
    expect(result).toBe('Hello, Bob!@#!');
  });
}); 