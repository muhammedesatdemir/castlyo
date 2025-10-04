export const onlyDigits = (s = '') => s.replace(/\D/g, '');

// Improved E.164 TR phone normalization
export const toE164TR = (digits?: string) => {
  if (!digits) return undefined;
  
  const d = onlyDigits(digits);
  
  // Already has country code
  if (d.startsWith('90') && d.length === 12) return `+${d}`;
  
  // 10 digits - add +90
  if (d.length === 10) return `+90${d}`;
  
  // 11 digits starting with 0 - remove 0 and add +90
  if (d.startsWith('0') && d.length === 11) return `+90${d.slice(1)}`;
  
  // If it already starts with +90, return as is
  if (digits.startsWith('+90')) return digits.replace(/\s+/g, '');
  
  return undefined;
};

export const splitE164TR = (e164?: string) => {
  const m = /^\+90(\d{10})$/.exec(e164 ?? '');
  return m ? { cc: '+90', digits: m[1] } : { cc: '+90', digits: '' };
};