import { AppError } from './AppError';

export class OAuth2Error extends AppError {
  constructor(message: string) {
    super(message, 'OAuth2Error');
  }
}
