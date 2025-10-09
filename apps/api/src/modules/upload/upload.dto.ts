import { IsEnum, IsString } from 'class-validator';

export enum UploadFolder {
  DOCUMENTS = 'documents',
  AGENCY_VERIFICATION = 'documents',
  PROFILES = 'profiles',
  PORTFOLIOS = 'portfolios',
  JOBS = 'jobs',
}

export class PresignDto {
  @IsString()
  fileName!: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
  fileType!: string;

  @IsEnum(UploadFolder)
  folder!: UploadFolder;
}


