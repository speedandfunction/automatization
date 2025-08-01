import { AppError } from './AppError';

export class OAuth2Error extends AppError {
  public readonly code: string;

  constructor(message: string, code: string = 'UNKNOWN_OAUTH2_ERROR') {
    super(message, 'OAuth2Error');
    this.code = code;
  }
}
