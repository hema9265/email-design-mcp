import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanupOldHistory, getStorageStats } from './storage-housekeeping.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DATA_DIR = join(homedir(), '.email-design-mcp');
const HISTORY_DIR = join(DATA_DIR, 'history');
const TEST_PREFIX = '__test_housekeeping_';

function makeTestEmail(id: string, daysAgo: number) {
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: `${TEST_PREFIX}${id}`,
    prompt: 'test',
    type: 'welcome',
    mjml: '<mjml></mjml>',
    html: '<html></html>',
    brandId: 'none',
    createdAt,
    currentVersion: 0,
    versions: [],
    refinements: [],
  };
}

describe('storage-housekeeping', () => {
  const testFiles: string[] = [];

  beforeEach(async () => {
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    for (const file of testFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Already deleted by cleanup
      }
    }
    testFiles.length = 0;
  });

  it('should delete emails older than 30 days', async () => {
    // Create an old email (40 days ago)
    const oldEmail = makeTestEmail('old', 40);
    const oldPath = join(HISTORY_DIR, `${oldEmail.id}.json`);
    await fs.writeFile(oldPath, JSON.stringify(oldEmail), 'utf-8');
    testFiles.push(oldPath);

    // Create a recent email (5 days ago)
    const recentEmail = makeTestEmail('recent', 5);
    const recentPath = join(HISTORY_DIR, `${recentEmail.id}.json`);
    await fs.writeFile(recentPath, JSON.stringify(recentEmail), 'utf-8');
    testFiles.push(recentPath);

    const result = await cleanupOldHistory();

    // Old email should be deleted
    expect(result.deleted).toBeGreaterThanOrEqual(1);

    // Recent email should still exist
    const recentExists = await fs.access(recentPath).then(() => true).catch(() => false);
    expect(recentExists).toBe(true);
  });

  it('should return storage stats', async () => {
    const stats = await getStorageStats();
    expect(stats).toHaveProperty('brands');
    expect(stats).toHaveProperty('emails');
    expect(stats).toHaveProperty('totalSizeKb');
    expect(typeof stats.brands).toBe('number');
    expect(typeof stats.emails).toBe('number');
    expect(typeof stats.totalSizeKb).toBe('number');
  });
});
