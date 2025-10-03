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
  fileType!: string;

  @IsEnum(UploadFolder)
  folder!: UploadFolder;
}


