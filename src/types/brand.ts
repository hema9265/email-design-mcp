export interface BrandProfile {
  id: string;
  url: string;
  name: string;

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: string;

  industry: string;
  audience: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';

  createdAt: string;
  updatedAt: string;
}
