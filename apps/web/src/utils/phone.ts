export const onlyDigits = (s = '') => s.replace(/\D/g, '');
export const toE164TR = (digits?: string) =>
  digits && onlyDigits(digits).length === 10 ? `+90${onlyDigits(digits)}` : undefined;

export const splitE164TR = (e164?: string) => {
  const m = /^\+90(\d{10})$/.exec(e164 ?? '');
  return m ? { cc: '+90', digits: m[1] } : { cc: '+90', digits: '' };
};