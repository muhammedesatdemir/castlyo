export type UiGender = 'Erkek' | 'Kadın';
export type ApiGender = 'MALE' | 'FEMALE';

export const uiToApiGender = (g?: UiGender): ApiGender | undefined =>
  g === 'Erkek' ? 'MALE' : g === 'Kadın' ? 'FEMALE' : undefined;

export const apiToUiGender = (g?: ApiGender | null): UiGender | undefined =>
  g === 'MALE' ? 'Erkek' : g === 'FEMALE' ? 'Kadın' : undefined;