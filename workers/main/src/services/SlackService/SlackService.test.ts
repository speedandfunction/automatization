import { WebAPICallResult } from '@slack/web-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors';
import { SlackService } from './SlackService';

vi.mock('@slack/web-api', () => ({
  WebClient: vi.fn().mockImplementation(() => ({
    chat: {
      postMessage: vi.fn().mockResolvedValue({ ok: true }),
    },
  })),
}));

vi.mock('../../configs/slack', () => ({
  slackConfig: { token: 'xoxb-test-token', channelId: 'C123456' },
}));

describe('SlackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if no token', async () => {
    vi.resetModules();
    vi.doMock('../../configs/slack', () => ({
      slackConfig: { token: '', channelId: 'C123456' },
    }));
    const { SlackService: SlackServiceNoToken } = await import(
      './SlackService'
    );

    expect(() => new SlackServiceNoToken()).toThrowError(/Slack token not set/);
  });

  it('throws if no channelId', async () => {
    vi.resetModules();
    vi.doMock('../../configs/slack', () => ({
      slackConfig: { token: 'xoxb-test-token', channelId: '' },
    }));
    const { SlackService: SlackServiceNoChannel } = await import(
      './SlackService'
    );
    const service = new SlackServiceNoChannel();

    await expect(service.postMessage('test')).rejects.toThrowError(
      /Slack channel ID not set/,
    );
  });

  it('calls postMessage and returns response', async () => {
    const service = new SlackService();
    const res = await service.postMessage('hello');

    expect(res.ok).toBe(true);
  });

  it('throws if Slack API returns error', async () => {
    const errorRes: WebAPICallResult = { ok: false, error: 'invalid_auth' };
    const service = new SlackService();
    const postMessageSpy = vi
      .spyOn(service['client'].chat, 'postMessage')
      .mockResolvedValue(errorRes);

    await expect(service.postMessage('fail')).rejects.toThrow(AppError);

    postMessageSpy.mockRestore();
  });
});
