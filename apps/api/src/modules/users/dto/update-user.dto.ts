import { IsOptional, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @Matches(/^\+90\d{10}$/, { message: 'Phone must be E.164 (+90XXXXXXXXXX)' })
  phone?: string;
}