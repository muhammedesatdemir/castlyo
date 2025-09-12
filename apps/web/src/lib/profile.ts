import { getProfileByUser } from "./mockProfileStore";

export async function getProfile(userId: string) {
  const p = getProfileByUser(userId) || { userId, bio: "", experience: "", specialties: [] };
  return p;
}


