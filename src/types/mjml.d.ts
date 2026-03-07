declare module 'mjml' {
  interface MjmlError {
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  }

  interface MjmlResult {
    html: string;
    json: unknown;
    errors: MjmlError[];
  }

  interface MjmlOptions {
    validationLevel?: 'strict' | 'soft' | 'skip';
    minify?: boolean;
    filePath?: string;
  }

  function mjml2html(mjml: string, options?: MjmlOptions): Promise<MjmlResult>;
  export default mjml2html;
}
