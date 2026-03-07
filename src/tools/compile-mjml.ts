import { z } from 'zod';
import { compileMjml } from '../lib/mjml-compiler.js';

export const compileMjmlSchema = z.object({
  mjml: z.string().describe('MJML source code to compile into responsive HTML'),
});

export async function compileMjmlHandler(args: z.infer<typeof compileMjmlSchema>) {
  const { mjml } = args;

  try {
    const result = await compileMjml(mjml);

    const response: Record<string, unknown> = {
      success: true,
      html: result.html,
      sizeKb: Math.round((Buffer.byteLength(result.html, 'utf8') / 1024) * 100) / 100,
    };

    if (result.errors.length > 0) {
      response.warnings = result.errors.map((e) => e.formattedMessage);
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: false,
              error: `MJML compilation failed: ${message}`,
              hint: 'Check that your MJML is valid. Ensure it starts with <mjml> and contains <mj-body>.',
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }
}
