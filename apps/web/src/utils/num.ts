export const toInt = (v?: string | number) => {
  const n = typeof v === 'number' ? v : parseInt((v ?? '').toString().trim(), 10);
  return Number.isFinite(n) ? n : undefined;
};