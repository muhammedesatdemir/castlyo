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
import { PresignDto } from './upload.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async generatePresignedUrl(@Body() body: PresignDto) {
    return await this.uploadService.presignPut(body);
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
