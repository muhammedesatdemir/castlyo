export const FEATURES = {
  PAYMENTS: process.env.PAYMENTS_ENABLED === 'true',
  ADV_PERMISSIONS: process.env.ADV_PERMISSIONS_ENABLED === 'true',
  SEARCH: process.env.SEARCH_ENABLED === 'true',
};
