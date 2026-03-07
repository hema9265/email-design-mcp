export type EmailType = 'welcome' | 'newsletter' | 'promotional' | 'transactional' | 'custom';

export interface GeneratedEmail {
  id: string;
  prompt: string;
  type: EmailType;

  mjml: string;
  html: string;

  brandId: string;
  templateUsed?: string;

  validation?: {
    sizeKb: number;
    darkModeCompatible: boolean;
    mobileResponsive: boolean;
    accessibilityScore: number;
  };

  createdAt: string;
  refinements: Array<{
    feedback: string;
    timestamp: string;
  }>;
}
