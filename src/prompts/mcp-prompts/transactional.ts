import { z } from 'zod';
import type { BrandProfile } from '../../types/brand.js';

export const TRANSACTIONAL_PROMPT_DESCRIPTION = 'Guided workflow to create a transactional email (receipt, confirmation, shipping notification, etc.)';

export const transactionalPromptSchema = z.object({
  brand_name: z.string().optional().describe('Brand or company name'),
  transaction_type: z.string().optional().describe('Type: order-confirmation, shipping, receipt, password-reset, verification, or generic'),
  order_details: z.string().optional().describe('Brief description of what to include (e.g., "order #, items, total")'),
  cta_text: z.string().optional().describe('Call-to-action button text (e.g., "Track Order", "View Receipt")'),
});

export const TRANSACTIONAL_PROMPT_ARGS = transactionalPromptSchema.shape;

export function buildTransactionalPromptMessages(
  args: Record<string, string | undefined>,
  brand?: BrandProfile | null,
) {
  const brandName = args.brand_name || brand?.name || '[Your Brand]';
  const txType = args.transaction_type || 'order-confirmation';
  const orderDetails = args.order_details || 'order number, item list, and total';
  const ctaText = args.cta_text || 'View Order';

  const brandContext = brand
    ? `\nUse these brand settings:
- Colors: primary ${brand.colors.primary}, secondary ${brand.colors.secondary}, accent ${brand.colors.accent}, background ${brand.colors.background}, text ${brand.colors.text}
- Fonts: heading "${brand.fonts.heading}", body "${brand.fonts.body}"
- Industry: ${brand.industry}`
    : '';

  const typeDescriptions: Record<string, string> = {
    'order-confirmation': 'an order confirmation email showing the order was received successfully',
    'shipping': 'a shipping notification email with tracking information',
    'receipt': 'a payment receipt/invoice email with itemized details',
    'password-reset': 'a password reset email with a secure reset link',
    'verification': 'an email verification/account activation email',
    'generic': 'a clean transactional notification email',
  };

  const typeDesc = typeDescriptions[txType] || typeDescriptions['generic'];

  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Create a transactional email for ${brandName} with the following details:

- **Type**: ${txType} — ${typeDesc}
- **Include**: ${orderDetails}
- **CTA button text**: "${ctaText}"
${brandContext}

Please use the generate_email tool with type "transactional", then compile_mjml to get the HTML. After that, use validate_email to check the output.

Suggested generate_email prompt: "Create ${typeDesc} for ${brandName}. Include placeholder data for ${orderDetails}. Use '${ctaText}' as the primary CTA. Keep the design minimal, professional, and information-focused. Transactional emails should be clean and scannable — no heavy marketing or promotional content."`,
        },
      },
    ],
  };
}
