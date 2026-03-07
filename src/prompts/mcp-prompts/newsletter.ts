import { z } from 'zod';
import type { BrandProfile } from '../../types/brand.js';

export const NEWSLETTER_PROMPT_DESCRIPTION = 'Guided workflow to create a newsletter email with featured content and articles';

export const newsletterPromptSchema = z.object({
  brand_name: z.string().optional().describe('Brand or company name'),
  frequency: z.string().optional().describe('Newsletter frequency (e.g., "weekly", "monthly")'),
  featured_topic: z.string().optional().describe('Main topic or headline for the featured article'),
  num_articles: z.string().optional().describe('Number of article sections to include (default: 3)'),
  style: z.string().optional().describe('Layout style: magazine, digest, or editorial'),
});

export const NEWSLETTER_PROMPT_ARGS = newsletterPromptSchema.shape;

export function buildNewsletterPromptMessages(
  args: Record<string, string | undefined>,
  brand?: BrandProfile | null,
) {
  const brandName = args.brand_name || brand?.name || '[Your Brand]';
  const frequency = args.frequency || 'weekly';
  const topic = args.featured_topic || 'the latest updates';
  const numArticles = args.num_articles || '3';
  const style = args.style || 'magazine';

  const brandContext = brand
    ? `\nUse these brand settings:
- Colors: primary ${brand.colors.primary}, secondary ${brand.colors.secondary}, accent ${brand.colors.accent}, background ${brand.colors.background}, text ${brand.colors.text}
- Fonts: heading "${brand.fonts.heading}", body "${brand.fonts.body}"
- Industry: ${brand.industry}
- Audience: ${brand.audience}`
    : '';

  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Create a ${frequency} newsletter email for ${brandName} with the following details:

- **Featured topic**: ${topic}
- **Number of articles**: ${numArticles}
- **Layout style**: ${style}
${brandContext}

Please use the generate_email tool with type "newsletter" and style "${style}", then compile_mjml to get the HTML. After that, use validate_email to check the output.

Suggested generate_email prompt: "Create a ${frequency} newsletter for ${brandName} featuring '${topic}' as the main article. Include ${numArticles} article sections total with placeholder content. Use a ${style} layout style with clear visual hierarchy between the featured article and secondary content."`,
        },
      },
    ],
  };
}
