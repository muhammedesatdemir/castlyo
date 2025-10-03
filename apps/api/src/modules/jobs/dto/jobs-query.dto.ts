import { IsOptional, IsString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class JobsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  // Şehirde Türkçe karakter vs. var, alpha kullanma
  city?: string;

  @IsOptional()
  @IsString()
  // FILM/THEATER/COMMERCIAL/TV gibi farklı enumlar olabilir; uppercase'a çek
  @Transform(({ value }) => String(value).toUpperCase())
  jobType?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).toUpperCase())
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit = 20;
}
