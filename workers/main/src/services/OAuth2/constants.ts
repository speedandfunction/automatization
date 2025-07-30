export const TOKEN_CONFIG = {
  TOKEN_BUFFER_MINUTES: 5,
  EXPIRY_BUFFER_SECONDS: 60,
  DEFAULT_TOKEN_TYPE: 'Bearer',
  CONTENT_TYPE: 'application/x-www-form-urlencoded',
  ACCEPT_TYPE: 'application/json',
} as const;

export const ERROR_MESSAGES = {
  NO_ACCESS_TOKEN: 'Failed to obtain access token',
  NO_REFRESH_TOKEN: 'No refresh token available in configuration or file',
  REFRESH_FAILED: 'Failed to refresh access token',
  INVALID_TOKEN_DATA: 'Invalid token data structure',
} as const;
