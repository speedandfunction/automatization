import { AppError } from './AppError';

export class FileUtilsError extends AppError {
  constructor(message: string) {
    super(message, 'FileUtilsError');
  }
}
