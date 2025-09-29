import { IsEmail, IsString, MinLength, IsEnum, IsBoolean, IsOptional, IsPhoneNumber, Matches, Length, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserRole {
  TALENT = 'TALENT',
  AGENCY = 'AGENCY'
}

export class ConsentDto {
  @IsBoolean()
  acceptedTerms: boolean;

  @IsBoolean()
  acceptedPrivacy: boolean;

  @IsString()
  termsVersion: string;

  @IsString()
  privacyVersion: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  password: string;

  @IsString()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters' })
  passwordConfirm: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsPhoneNumber('TR')
  phone?: string;

  @ValidateNested()
  @Type(() => ConsentDto)
  consents: ConsentDto;

  // Legacy fields for backward compatibility (deprecated)
  @IsOptional()
  @IsBoolean()
  kvkkConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  termsConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  // Profile fields for immediate registration
  @IsOptional()
  @IsString()
  @Length(2, 50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  lastName?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(['BEGINNER', 'AMATEUR', 'SEMI_PRO', 'PROFESSIONAL'])
  experience?: 'BEGINNER' | 'AMATEUR' | 'SEMI_PRO' | 'PROFESSIONAL';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class EmailVerificationDto {
  @IsString()
  token: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(8)
  passwordConfirm: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
