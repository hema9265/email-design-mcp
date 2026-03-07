export interface ToolResponse {
  content: Array<TextContent | ImageContent>;
  isError?: boolean;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}
