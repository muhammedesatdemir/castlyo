export type MenuItem = 
  | { label: string; href: string; requiresAuth?: never; role?: never }
  | { label: string; href: string; requiresAuth: true; role?: never }
  | { label: string; href: string; requiresAuth?: never; role: 'TALENT' | 'AGENCY' };

export const MENU: MenuItem[] = [
  { label: 'Keşfet', href: '/#discover' },
  { label: 'İlanlar', href: '/jobs' },
  { label: 'Özellikler', href: '/#features' },
  { label: 'Yetenek Olarak Başla', href: '/onboarding/talent', role: 'TALENT' },
  { label: 'Ajans Olarak Başla', href: '/onboarding/agency', role: 'AGENCY' },
  // Sadece giriş sonrası:
  { label: 'Profilim', href: '/profile', requiresAuth: true },
];
