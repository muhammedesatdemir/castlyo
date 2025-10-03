import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertAgencyProfileDto {
  @IsOptional() @IsString() @MaxLength(255) agencyName?: string;
  @IsOptional() @IsString() @MaxLength(255) companyName?: string;
  @IsOptional() @IsString() taxNumber?: string;
  @IsOptional() @IsString() about?: string;
  @IsOptional() @IsString() website?: string;

  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;

  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail()  contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;

  @IsOptional() @IsArray()  specialties?: string[];

  // Dosya yükleme sonrası gelen storage anahtarı
  @IsOptional() @IsString() verificationDocKey?: string;

  // DİKKAT: İstemciden gelse bile asla kullanılmayacak
  @IsOptional() @IsBoolean() isVerified?: boolean;
}


