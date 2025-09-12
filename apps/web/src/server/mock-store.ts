export type TalentProfile = {
  userId: string;
  status: 'DRAFT' | 'COMPLETE';
  bio?: string;
  experience?: string;
  specialties: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};

export const MockStore = {
  users: new Map<string, any>(),
  tokens: new Map<string, any>(),
  talentProfiles: new Map<string, TalentProfile>(),
};

export function upsertTalentProfile(userId: string, patch: Partial<TalentProfile>) {
  const now = new Date();
  const prev: TalentProfile = MockStore.talentProfiles.get(userId) ?? {
    userId, status: 'DRAFT', specialties: [], createdAt: now, updatedAt: now,
  };
  const next: TalentProfile = {
    ...prev,
    ...patch,
    specialties: patch.specialties ?? prev.specialties,
    updatedAt: now,
  };
  MockStore.talentProfiles.set(userId, next);
  return next;
}


