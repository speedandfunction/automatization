import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MongoPool } from './MongoPool';

vi.mock('mongoose', () => {
  let readyState = 0;

  return {
    __esModule: true,
    default: {
      connect: vi.fn(async () => {
        readyState = 1;
      }),
      disconnect: vi.fn(async () => {
        readyState = 0;
      }),
      get connection() {
        return { readyState };
      },
      ConnectionStates: { connected: 1 },
    },
    ConnectionStates: { connected: 1 },
    connection: {
      get readyState() {
        return readyState;
      },
    },
  };
});

describe('MongoPool', () => {
  let mongoPool: MongoPool;

  beforeEach(() => {
    mongoPool = MongoPool.getInstance();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await mongoPool.disconnect();
  });

  it('should return the same instance (singleton)', () => {
    const instance2 = MongoPool.getInstance();

    expect(mongoPool).toBe(instance2);
  });

  it('should connect and set connection', async () => {
    const conn = await mongoPool.connect();

    expect(mongoose.connect).toHaveBeenCalled();
    expect(conn).toBeTruthy();
    expect(conn.readyState).toBe(1);
  });

  it('should not reconnect if already connected', async () => {
    await mongoPool.connect();
    await mongoPool.connect();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('should disconnect if connected', async () => {
    await mongoPool.connect();
    await mongoPool.disconnect();
    expect(mongoose.disconnect).toHaveBeenCalled();
    expect(mongoPool.getConnection()).toBeNull();
  });

  it('should not disconnect if not connected', async () => {
    await mongoPool.disconnect();
    expect(mongoose.disconnect).not.toHaveBeenCalled();
  });

  it('should throw on connect error', async () => {
    vi.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('fail'));
    await expect(mongoPool.connect()).rejects.toThrow(
      'MongoDB connection error: fail',
    );
  });

  it('should throw on disconnect error', async () => {
    await mongoPool.connect();
    vi.spyOn(mongoose, 'disconnect').mockRejectedValueOnce(new Error('fail'));
    await expect(mongoPool.disconnect()).rejects.toThrow(
      'MongoDB disconnection error: fail',
    );
  });

  it('getConnection returns current connection or null', async () => {
    expect(mongoPool.getConnection()).toBeNull();
    await mongoPool.connect();
    expect(mongoPool.getConnection()).toBeTruthy();
  });
});
