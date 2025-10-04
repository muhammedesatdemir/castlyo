/**
 * Clean up old role-related localStorage keys
 * This should be called once during app initialization to remove stale data
 */
export function cleanupOldRoleStorage() {
  if (typeof window === 'undefined') return;
  
  const oldKeys = [
    'userRole',
    'auth.role', 
    'castlyo:role',
    'user_role',
    'role'
  ];
  
  let cleaned = 0;
  oldKeys.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.info(`[CLEANUP] Removed ${cleaned} old role storage keys`);
  }
}

/**
 * Development helper - can be called from console
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cleanupOldRoleStorage = cleanupOldRoleStorage;
}
