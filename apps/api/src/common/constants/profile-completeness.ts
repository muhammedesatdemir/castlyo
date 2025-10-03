export const TALENT_REQUIRED_FIELDS = [
  'firstName',
  'lastName', 
  'city',
  'gender',
  'birthDate'
] as const;

export const AGENCY_REQUIRED_FIELDS = [
  'email',
  'phone'
] as const;

export type TalentRequiredField = typeof TALENT_REQUIRED_FIELDS[number];
export type AgencyRequiredField = typeof AGENCY_REQUIRED_FIELDS[number];
