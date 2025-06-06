import { AppError } from './AppError';

export class TargetUnitRepositoryError extends AppError {
  constructor(message: string) {
    super(message, 'TargetUnitRepositoryError');
  }
}
