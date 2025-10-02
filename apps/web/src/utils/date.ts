export const ddmmyyyyToISO = (ddmmyyyy?: string): string | undefined => {
  if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return undefined;
  
  // If already in ISO format (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) {
    return ddmmyyyy;
  }
  
  // Convert DD.MM.YYYY to YYYY-MM-DD
  const match = ddmmyyyy.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
  }
  
  return undefined;
};

export const isoToDDMMYYYY = (iso?: string): string => {
  if (!iso || typeof iso !== 'string') return '';
  
  // If already in DD.MM.YYYY format, return as is
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(iso)) {
    return iso;
  }
  
  // Convert YYYY-MM-DD to DD.MM.YYYY
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${dd}.${mm}.${yyyy}`;
  }
  
  return iso;
};