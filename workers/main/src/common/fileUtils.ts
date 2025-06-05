import { promises as fs } from 'fs';
import path from 'path';

import { FileUtilsError } from './errors';

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    return JSON.parse(content) as T;
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
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    throw new FileUtilsError(`Failed to write JSON file at "${filePath}"`);
  }
}
