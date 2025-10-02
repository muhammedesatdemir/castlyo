import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsNumber, 
  IsBoolean, 
  IsDateString,
  IsUrl,
  IsInt,
  Min, 
  Max, 
  Length 
} from 'class-validator';
import { Transform, Type, Expose } from 'class-transformer';

// ---- types ----
export type ApiGender = 'MALE' | 'FEMALE';

// ---- transformation helpers ----
const GENDER_MAP: Record<string, ApiGender> = {
  Kadın: 'FEMALE',
  Kadin: 'FEMALE',
  Female: 'FEMALE',
  Erkek: 'MALE',
  Male: 'MALE',
};

function toIsoBirthDate(v: any): any {
  if (!v || typeof v !== 'string') return v;
  // 11.02.2000 -> 2000-02-11
  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const [, dd, MM, yyyy] = m;
    return `${yyyy}-${MM}-${dd}`;
  }
  return v;
}

function toEnumGender(v: any): any {
  if (!v) return v;
  if (typeof v === 'string' && GENDER_MAP[v] != null) return GENDER_MAP[v];
  const upper = String(v).toUpperCase();
  if (upper === 'FEMALE' || upper === 'MALE') return upper as 'MALE' | 'FEMALE';
  return v;
}

function toNumberOrUndefined(v: any): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStringArray(v: any): string[] | undefined {
  if (v == null || v === '') return undefined;
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  // "A,B" -> ["A","B"]
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export class CreateTalentProfileDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  headline?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsEnum(['MALE', 'FEMALE'])
  gender: 'MALE' | 'FEMALE';

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  weight?: number;

  @IsOptional()
  @IsString()
  eyeColor?: string;

  @IsOptional()
  @IsString()
  hairColor?: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsOptional()
  @IsUrl(
    { require_tld: false, require_protocol: true, allow_underscores: true },
    { message: 'profileImage must be a valid URL' }
  )
  profileImage?: string;

  @IsOptional()
  @IsUrl(
    { require_tld: false, require_protocol: true, allow_underscores: true },
    { message: 'resumeUrl must be a valid URL' }
  )
  resumeUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioImages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioVideos?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTalentProfileDto {
  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  @Length(2, 200)
  displayName?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  @Length(0, 1000)
  bio?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  country?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  @Length(0, 200)
  headline?: string;

  @IsOptional()
  @Transform(({ value }) => {
    const s = String(value ?? '').trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @Length(0, 2000)
  experience?: string;

  // FE'den "height" ve "weight" geliyor; service bunları height_cm/weight_kg'ye yazar
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(50)
  @Max(250)
  height?: number;

  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(20)
  @Max(250)
  weight?: number;

  // Direct heightCm and weightKg fields for API consistency
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(250)
  weightKg?: number;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  @Length(2, 50)
  @Expose({ name: 'first_name' })
  firstName?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? '').trim() || undefined)
  @IsString()
  @Length(2, 50)
  @Expose({ name: 'last_name' })
  lastName?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : String(value)))
  @IsString({ message: 'profileImage must be a string URL-like' })
  profileImage?: string;

  // YENİ: DB ile hizaladık
  @IsOptional()
  @Transform(({ value }) => toIsoBirthDate(value))
  @IsDateString({}, { message: 'birthDate must be ISO (YYYY-MM-DD)' })
  birthDate?: string; // "2000-02-11" gibi ISO

  // Snake_case alias for API consistency
  @IsOptional()
  @Transform(({ value }) => toIsoBirthDate(value))
  @IsDateString({}, { message: 'birth_date must be ISO (YYYY-MM-DD)' })
  @Expose({ name: 'birth_date' })
  birth_date?: string;

  @IsOptional()
  @Transform(({ value }) => toEnumGender(value))
  @IsEnum(['MALE', 'FEMALE'], { message: 'gender must be one of MALE | FEMALE' })
  gender?: ApiGender;

  // Snake_case aliases for height and weight
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(250)
  @Expose({ name: 'height_cm' })
  height_cm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(250)
  @Expose({ name: 'weight_kg' })
  weight_kg?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : String(value)))
  @IsString({ message: 'resumeUrl must be a string URL-like' })
  @Expose({ name: 'resume_url' })
  resumeUrl?: string;

  // Handle legacy cv_url field - map it to resumeUrl
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : String(value)))
  @IsString({ message: 'cv_url must be a string URL-like' })
  @Expose({ name: 'cv_url' })
  set cvUrl(value: string | undefined) {
    if (value) this.resumeUrl = value;
  }

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  portfolioImages?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  portfolioVideos?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateAgencyProfileDto {
  @IsString()
  @Length(2, 200)
  companyName: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  tradeName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  @Length(2, 200)
  contactPerson: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationDocuments?: string[];
}

export class UpdateAgencyProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  tradeName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @Length(2, 200)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationDocuments?: string[];
}
