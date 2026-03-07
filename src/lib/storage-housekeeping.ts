import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { GeneratedEmail } from '../types/email.js';

const DATA_DIR = join(homedir(), '.email-design-mcp');
const HISTORY_DIR = join(DATA_DIR, 'history');
const CONFIG_PATH = join(DATA_DIR, 'config.json');

const DEFAULT_RETENTION_DAYS = 30;

interface ServerConfig {
  historyRetentionDays: number;
  previewPort: number;
}

async function loadConfig(): Promise<ServerConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data) as Partial<ServerConfig>;
    return {
      historyRetentionDays: config.historyRetentionDays ?? DEFAULT_RETENTION_DAYS,
      previewPort: config.previewPort ?? 3947,
    };
  } catch {
    return {
      historyRetentionDays: DEFAULT_RETENTION_DAYS,
      previewPort: 3947,
    };
  }
}

export async function cleanupOldHistory(): Promise<{ deleted: number; kept: number }> {
  const config = await loadConfig();
  const retentionMs = config.historyRetentionDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;

  let deleted = 0;
  let kept = 0;

  try {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
    const files = await fs.readdir(HISTORY_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(HISTORY_DIR, file);
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const email = JSON.parse(data) as GeneratedEmail;
        const createdAt = new Date(email.createdAt).getTime();

        if (createdAt < cutoff) {
          await fs.unlink(filePath);
          deleted++;
        } else {
          kept++;
        }
      } catch {
        // Corrupted file — delete it
        await fs.unlink(filePath);
        deleted++;
      }
    }
  } catch {
    // History dir doesn't exist yet — nothing to clean
  }

  return { deleted, kept };
}

export async function getStorageStats(): Promise<{
  brands: number;
  emails: number;
  totalSizeKb: number;
}> {
  const brandsDir = join(DATA_DIR, 'brands');
  let brands = 0;
  let emails = 0;
  let totalSize = 0;

  try {
    const brandFiles = await fs.readdir(brandsDir);
    brands = brandFiles.filter((f) => f.endsWith('.json')).length;
    for (const file of brandFiles) {
      if (!file.endsWith('.json')) continue;
      const stat = await fs.stat(join(brandsDir, file));
      totalSize += stat.size;
    }
  } catch {
    // No brands dir
  }

  try {
    const historyFiles = await fs.readdir(HISTORY_DIR);
    emails = historyFiles.filter((f) => f.endsWith('.json')).length;
    for (const file of historyFiles) {
      if (!file.endsWith('.json')) continue;
      const stat = await fs.stat(join(HISTORY_DIR, file));
      totalSize += stat.size;
    }
  } catch {
    // No history dir
  }

  return {
    brands,
    emails,
    totalSizeKb: Math.round((totalSize / 1024) * 100) / 100,
  };
}
