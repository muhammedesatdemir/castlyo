import { IsBoolean, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'User role', enum: ['AGENCY', 'TALENT', 'USER'] })
  @IsString()
  role: string;

  @ApiProperty({ description: 'User status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Email verification status' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ description: 'User creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Whether agency profile is complete' })
  @IsBoolean()
  isAgencyProfileComplete: boolean;

  @ApiProperty({ description: 'Whether talent profile is complete' })
  @IsBoolean()
  isTalentProfileComplete: boolean;

  @ApiProperty({ description: 'Whether user can post jobs' })
  @IsBoolean()
  canPostJobs: boolean;

  @ApiProperty({ description: 'Whether user can apply to jobs' })
  @IsBoolean()
  canApplyJobs: boolean;
}
