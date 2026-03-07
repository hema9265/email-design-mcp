import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

const TEMPLATE_CATALOG = [
  { id: 'welcome', name: 'Welcome Email', description: 'Hero + intro text + CTA for new subscribers' },
  { id: 'newsletter', name: 'Newsletter', description: 'Header + multiple content blocks + footer' },
  { id: 'promotional', name: 'Promotional', description: 'Hero image + offer + CTA + urgency' },
  { id: 'transactional', name: 'Transactional', description: 'Order confirmation with itemized details + clean layout' },
];

export async function listTemplateResources(): Promise<Array<{ uri: string; name: string; description: string }>> {
  return TEMPLATE_CATALOG.map((t) => ({
    uri: `templates://library/${t.id}`,
    name: t.name,
    description: t.description,
  }));
}

export async function readTemplateResource(templateId: string): Promise<string | null> {
  const filePath = join(TEMPLATES_DIR, `${templateId}.mjml`);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}
