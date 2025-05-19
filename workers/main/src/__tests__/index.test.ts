import { describe, it, expect} from 'vitest';
import { run } from '../index';

describe('run', () => {
  it('should return true', async () => {
    await expect(run()).resolves.toBe(true);
  });
});
