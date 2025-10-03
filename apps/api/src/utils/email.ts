export const FREE_EMAIL_DOMAINS = new Set<string>([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yandex.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'live.com',
]);

export function isCorporateDomain(email?: string | null): boolean {
  if (!email) return false;
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return false;
  const domain = email.slice(atIndex + 1).toLowerCase().trim();
  return domain.length > 0 && !FREE_EMAIL_DOMAINS.has(domain);
}


