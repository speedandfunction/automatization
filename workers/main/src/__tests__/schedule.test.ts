import { describe, it, expect, vi, beforeEach } from 'vitest';

const describeMock = vi.fn();
const createMock = vi.fn();

vi.mock('@temporalio/client', () => {
  return {
    ScheduleClient: vi.fn().mockImplementation(() => ({
      getHandle: () => ({ describe: describeMock }),
      create: createMock,
    })),
    Connection: vi.fn(),
  };
});

describe('createScheduleIfNotExists', () => {
  beforeEach(() => {
    describeMock.mockReset();
    createMock.mockReset();
  });

  it('does nothing if schedule exists', async () => {
    describeMock.mockResolvedValue({});
    const { createScheduleIfNotExists } = await import('../utils/schedule');
    await expect(createScheduleIfNotExists({} as any)).resolves.toBeUndefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates schedule if not found', async () => {
    describeMock.mockRejectedValue({ name: 'NotFoundError' });
    createMock.mockResolvedValue({});
    const { createScheduleIfNotExists } = await import('../utils/schedule');
    await expect(createScheduleIfNotExists({} as any)).resolves.toBeUndefined();
    expect(createMock).toHaveBeenCalled();
  });

  it('throws error if unknown error', async () => {
    describeMock.mockRejectedValue({ name: 'OtherError' });
    const { createScheduleIfNotExists } = await import('../utils/schedule');
    await expect(createScheduleIfNotExists({} as any)).rejects.toMatchObject({ name: 'OtherError' });
    expect(createMock).not.toHaveBeenCalled();
  });
}); 