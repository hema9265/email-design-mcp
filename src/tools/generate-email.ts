import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { loadBrand, listBrands, saveEmail } from '../lib/storage.js';
import { compileMjml } from '../lib/mjml-compiler.js';
import { EMAIL_EXPERT_PROMPT } from '../prompts/system/email-expert.js';
import { MJML_GUIDE_PROMPT } from '../prompts/system/mjml-guide.js';
import { buildBrandContext, buildNoBrandContext } from '../prompts/system/brand-injector.js';
import { DESIGN_RULES } from '../prompts/design-rules/index.js';
import { selectLayoutVariant } from '../prompts/layouts/index.js';
import type { EmailType, GeneratedEmail } from '../types/email.js';

const emailTypes: [string, ...string[]] = ['welcome', 'newsletter', 'promotional', 'transactional', 'custom'];

export const generateEmailSchema = z.object({
  prompt: z.string().describe('Description of the email to generate (e.g., "Create a welcome email for new subscribers")'),
  type: z.enum(emailTypes).optional().describe('Email type. Auto-detected from prompt if not specified.'),
  brand_id: z.string().optional().describe('Brand profile ID to use. Uses the most recently updated brand if not specified.'),
  style: z.string().optional().describe('Layout style preference (e.g., "minimalist", "hero", "grid"). Picks a matching variant.'),
});

export async function generateEmailHandler(args: z.infer<typeof generateEmailSchema>) {
  const emailType: EmailType = (args.type as EmailType) || detectEmailType(args.prompt);

  // Load brand
  let brandContext: string;
  let brandId = 'none';
  if (args.brand_id) {
    const brand = await loadBrand(args.brand_id);
    if (!brand) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: `Brand "${args.brand_id}" not found.`,
              hint: 'Use setup_brand to create a brand profile first, or omit brand_id to use defaults.',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
    brandContext = buildBrandContext(brand);
    brandId = brand.id;
  } else {
    // Try to use most recently updated brand
    const brands = await listBrands();
    if (brands.length > 0) {
      const latest = brands.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      brandContext = buildBrandContext(latest);
      brandId = latest.id;
    } else {
      brandContext = buildNoBrandContext();
    }
  }

  // Select layout variant
  const variant = selectLayoutVariant(emailType, args.style);
  const layoutInstructions = variant
    ? `## LAYOUT VARIANT: ${variant.name}\n\n${variant.instructions}`
    : '## LAYOUT\n\nUse a clean, professional single-column layout appropriate for the email type.';

  // Compose the full system prompt
  const systemPrompt = [
    EMAIL_EXPERT_PROMPT,
    MJML_GUIDE_PROMPT,
    DESIGN_RULES,
    brandContext,
    layoutInstructions,
  ].join('\n\n---\n\n');

  const userInstruction = `Generate a complete, production-ready MJML email based on this request:

"${args.prompt}"

Email type: ${emailType}
${variant ? `Layout variant: ${variant.name} — ${variant.description}` : ''}

IMPORTANT:
- Output ONLY valid MJML code, nothing else
- Start with <mjml> and end with </mjml>
- Include all sections as described in the layout instructions
- Use the brand colors and fonts specified in the brand context
- Add section label comments (<!-- section:header -->, <!-- section:hero -->, etc.)
- Use placeholder images from https://placehold.co/ where needed
- Include an unsubscribe link in the footer`;

  // Create email record
  const emailId = randomUUID().slice(0, 8);
  const email: GeneratedEmail = {
    id: emailId,
    prompt: args.prompt,
    type: emailType,
    mjml: '',
    html: '',
    brandId,
    createdAt: new Date().toISOString(),
    refinements: [],
  };

  await saveEmail(email);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            success: true,
            emailId,
            emailType,
            layoutVariant: variant ? variant.name : 'default',
            brandId,
            message: 'Email generation context prepared. Use the system prompt and user instruction below to generate the MJML, then call compile_mjml to compile it.',
            systemPrompt,
            userInstruction,
            hint: 'After the AI generates MJML from these instructions, call compile_mjml with the MJML output to get the final HTML.',
          },
          null,
          2,
        ),
      },
    ],
  };
}

function detectEmailType(prompt: string): EmailType {
  const lower = prompt.toLowerCase();

  if (/welcome|onboard|sign.?up|join|new (user|member|subscriber)/.test(lower)) {
    return 'welcome';
  }
  if (/newsletter|digest|weekly|monthly|update|roundup/.test(lower)) {
    return 'newsletter';
  }
  if (/promo|sale|discount|offer|deal|launch|announce|campaign|black friday|cyber monday/.test(lower)) {
    return 'promotional';
  }
  if (/receipt|confirm|invoice|order|shipping|tracking|reset|verify|transactional/.test(lower)) {
    return 'transactional';
  }

  return 'custom';
}
