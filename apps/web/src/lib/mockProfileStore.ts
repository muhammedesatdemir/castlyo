// apps/web/src/lib/mockProfileStore.ts
type TalentProfile = {
  userId: string;
  bio?: string;
  experience?: string;
  specialties?: string[];
};
const memory = new Map<string, TalentProfile>();
export function getProfileByUser(userId: string) {
  return memory.get(userId) || null;
}
export function upsertProfile(input: TalentProfile) {
  const current = memory.get(input.userId) || { userId: input.userId, specialties: [] };
  const next = { ...current, ...input };
  memory.set(input.userId, next);
  return next;
}


