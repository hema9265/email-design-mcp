import mjml2html from 'mjml';

export interface CompilationResult {
  html: string;
  errors: MjmlError[];
}

export interface MjmlError {
  line: number;
  message: string;
  tagName: string;
  formattedMessage: string;
}

export async function compileMjml(mjmlSource: string): Promise<CompilationResult> {
  const result = await mjml2html(mjmlSource, {
    validationLevel: 'soft',
    minify: false,
  });

  const errors: MjmlError[] = (result.errors || []).map((err) => ({
    line: err.line ?? 0,
    message: err.message ?? '',
    tagName: err.tagName ?? '',
    formattedMessage: err.formattedMessage ?? err.message ?? '',
  }));

  return {
    html: result.html,
    errors,
  };
}
