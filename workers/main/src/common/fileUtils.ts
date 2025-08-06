import { promises as fs } from 'fs';
import path from 'path';

import { FileUtilsError } from './errors';

export async function readJsonFile<T = object>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content) as T;

    return parsed;
  } catch {
    throw new FileUtilsError(
      `Failed to read or parse JSON file at "${filePath}"`,
    );
  }
}

export async function writeJsonFile<T = object>(
  filePath: string,
  data: T,
): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch {
    throw new FileUtilsError(`Failed to write JSON file at "${filePath}"`);
  }
}

export async function deleteJsonFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore ENOENT (file not found) errors as they're expected when clearing
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new FileUtilsError(`Failed to delete JSON file at "${filePath}"`);
    }
  }
}
