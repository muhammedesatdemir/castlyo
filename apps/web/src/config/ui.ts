export type LandingVariant = 'classic' | 'minimal';

export const UI = {
  landingVariant: (process.env.NEXT_PUBLIC_LANDING_VARIANT as LandingVariant) ?? 'classic',
} as const;
