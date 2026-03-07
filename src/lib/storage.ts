import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { BrandProfile } from '../types/brand.js';
import type { GeneratedEmail } from '../types/email.js';

const DATA_DIR = join(homedir(), '.email-design-mcp');
const BRANDS_DIR = join(DATA_DIR, 'brands');
const HISTORY_DIR = join(DATA_DIR, 'history');

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

// Brand operations

export async function saveBrand(brand: BrandProfile): Promise<void> {
  await ensureDir(BRANDS_DIR);
  const filePath = join(BRANDS_DIR, `${brand.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(brand, null, 2), 'utf-8');
}

export async function loadBrand(brandId: string): Promise<BrandProfile | null> {
  const filePath = join(BRANDS_DIR, `${brandId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as BrandProfile;
  } catch {
    return null;
  }
}

export async function listBrands(): Promise<BrandProfile[]> {
  await ensureDir(BRANDS_DIR);
  const files = await fs.readdir(BRANDS_DIR);
  const brands: BrandProfile[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = await fs.readFile(join(BRANDS_DIR, file), 'utf-8');
    brands.push(JSON.parse(data) as BrandProfile);
  }
  return brands;
}

export async function deleteBrand(brandId: string): Promise<boolean> {
  const filePath = join(BRANDS_DIR, `${brandId}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// Email history operations

export async function saveEmail(email: GeneratedEmail): Promise<void> {
  await ensureDir(HISTORY_DIR);
  const filePath = join(HISTORY_DIR, `${email.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(email, null, 2), 'utf-8');
}

export async function loadEmail(emailId: string): Promise<GeneratedEmail | null> {
  const filePath = join(HISTORY_DIR, `${emailId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as GeneratedEmail;
  } catch {
    return null;
  }
}

export async function listEmails(): Promise<GeneratedEmail[]> {
  await ensureDir(HISTORY_DIR);
  const files = await fs.readdir(HISTORY_DIR);
  const emails: GeneratedEmail[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = await fs.readFile(join(HISTORY_DIR, file), 'utf-8');
    emails.push(JSON.parse(data) as GeneratedEmail);
  }
  return emails;
}
