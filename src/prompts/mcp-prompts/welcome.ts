import { z } from 'zod';
import type { BrandProfile } from '../../types/brand.js';

export const WELCOME_PROMPT_DESCRIPTION = 'Guided workflow to create a welcome email for new subscribers or users';

export const welcomePromptSchema = z.object({
  brand_name: z.string().optional().describe('Brand or company name'),
  subscriber_benefit: z.string().optional().describe('What the subscriber gets (e.g., "exclusive deals", "weekly tips")'),
  cta_text: z.string().optional().describe('Call-to-action button text (e.g., "Get Started", "Explore Now")'),
  tone: z.string().optional().describe('Email tone: formal, casual, friendly, or professional'),
});

export const WELCOME_PROMPT_ARGS = welcomePromptSchema.shape;

export function buildWelcomePromptMessages(
  args: Record<string, string | undefined>,
  brand?: BrandProfile | null,
) {
  const brandName = args.brand_name || brand?.name || '[Your Brand]';
  const benefit = args.subscriber_benefit || 'exclusive content and updates';
  const ctaText = args.cta_text || 'Get Started';
  const tone = args.tone || brand?.tone || 'friendly';

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
          text: `Create a welcome email for ${brandName} with the following details:

- **Purpose**: Welcome new subscribers/users
- **Subscriber benefit**: ${benefit}
- **CTA button text**: "${ctaText}"
- **Tone**: ${tone}
${brandContext}

Please use the generate_email tool with this prompt, then compile_mjml to get the HTML. After that, use validate_email to check the output.

Suggested generate_email prompt: "Create a ${tone} welcome email for ${brandName}. Welcome new subscribers and highlight that they'll receive ${benefit}. Use '${ctaText}' as the primary call-to-action button text. Keep the design clean and professional."`,
        },
      },
    ],
  };
}
