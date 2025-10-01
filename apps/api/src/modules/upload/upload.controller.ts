import { 
  Controller, 
  Post, 
  Delete,
  Get,
  Body, 
  Param,
  UseGuards, 
  HttpCode,
  HttpStatus,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { IsString, IsEnum } from 'class-validator';

class GeneratePresignedUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsEnum(['profiles', 'portfolios', 'documents', 'jobs'])
  folder: 'profiles' | 'portfolios' | 'documents' | 'jobs';
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async generatePresignedUrl(@Body() body: GeneratePresignedUrlDto) {
    return await this.uploadService.generatePresignedPost(
      body.fileType,
      body.fileName,
      body.folder
    );
  }

  @Delete('file')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Body('fileUrl') fileUrl: string) {
    await this.uploadService.deleteFile(fileUrl);
    return { message: 'File deleted successfully' };
  }

  @Get('file-info')
  async getFileInfo(@Query('fileUrl') fileUrl: string) {
    return this.uploadService.getFileInfo(fileUrl);
  }
}
