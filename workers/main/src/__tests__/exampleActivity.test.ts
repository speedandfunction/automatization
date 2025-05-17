import { describe, it, expect } from 'vitest';
import { exampleActivity } from '../activities/exampleActivity';

describe('exampleActivity', () => {
  it('should process the provided name', async () => {
    const result = await exampleActivity('Alice');
    expect(result).toBe('Processed: Alice');
  });

  it('should handle empty string as name', async () => {
    const result = await exampleActivity('');
    expect(result).toBe('Processed: ');
  });

  it('should handle special characters in name', async () => {
    const result = await exampleActivity('Bob!@#');
    expect(result).toBe('Processed: Bob!@#');
  });
}); 