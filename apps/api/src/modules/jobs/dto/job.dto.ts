import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsNumber, 
  IsBoolean, 
  IsDateString,
  Min, 
  Max, 
  Length,
  IsDecimal
} from 'class-validator';

export class CreateJobPostDto {
  @IsString()
  @Length(5, 200)
  title: string;

  @IsString()
  @Length(20, 5000)
  description: string;

  @IsString()
  city: string;

  @IsEnum(['FILM', 'TV_SERIES', 'COMMERCIAL', 'THEATER', 'MUSIC_VIDEO', 'DOCUMENTARY', 'SHORT_FILM', 'FASHION', 'PHOTO_SHOOT', 'OTHER'])
  job_type: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  requirements?: string;

  // age_min and age_max fields removed - columns no longer exist in DB

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary_max?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  application_deadline: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_applications?: number;

  // Legacy fields for backward compatibility
  @IsOptional()
  @IsString()
  budget_range?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsDateString()
  shootingStartDate?: string;

  @IsOptional()
  @IsDateString()
  shootingEndDate?: string;

  // ageMin and ageMax fields removed - columns no longer exist in DB

  @IsOptional()
  @IsArray()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], { each: true })
  genderPreference?: string[];

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  heightMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  heightMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  contactInformation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateJobPostDto {
  @IsOptional()
  @IsString()
  @Length(5, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(20, 5000)
  description?: string;

  @IsOptional()
  @IsEnum(['FILM', 'TV_SERIES', 'COMMERCIAL', 'THEATER', 'MUSIC_VIDEO', 'DOCUMENTARY', 'SHORT_FILM', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsEnum(['ACTOR', 'MODEL', 'MUSICIAN', 'DANCER', 'PRESENTER', 'VOICE_ACTOR', 'INFLUENCER', 'OTHER'])
  talentType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  requirements?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsOptional()
  @IsDateString()
  shootingStartDate?: string;

  @IsOptional()
  @IsDateString()
  shootingEndDate?: string;

  // ageMin and ageMax fields removed - columns no longer exist in DB

  @IsOptional()
  @IsArray()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], { each: true })
  genderPreference?: string[];

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  heightMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  heightMax?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  contactInformation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class CreateJobApplicationDto {
  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  jobPostId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  coverLetter?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioItems?: string[];

  @IsOptional()
  @IsString()
  expectedSalary?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  // Flexible profile nested ref
  @IsOptional()
  profile?: { talentProfileId?: string };

  // Root alternative
  @IsOptional()
  @IsString()
  talentProfileId?: string;
}

export class UpdateJobApplicationDto {
  @IsEnum(['PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
