export const isMinor = (birthDate?: string): boolean => {
  if (!birthDate) return false;
  
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  
  return age < 18;
};

export const calculateAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  
  return age;
};
