import { IsEmail, IsString, MinLength, IsEnum, IsBoolean, IsOptional, IsPhoneNumber } from 'class-validator';

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
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters' })
  passwordConfirm: string;

  @IsEnum(['TALENT', 'AGENCY'])
  role: 'TALENT' | 'AGENCY';

  @IsOptional()
  @IsPhoneNumber('TR')
  phone?: string;

  @IsBoolean()
  kvkkConsent: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

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
