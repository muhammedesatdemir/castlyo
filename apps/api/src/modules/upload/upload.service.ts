import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedPostData {
  url: string;
  fields: Record<string, string>;
  fileUrl: string;
}

@Injectable()
export class UploadService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    // For development, we'll use local storage simulation
    // In production, this would be configured with real S3 credentials
    this.bucketName = this.configService.get('S3_BUCKET_NAME', 'castlyo-dev');
    
    // Mock S3 configuration for development
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', 'dev-access-key'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', 'dev-secret-key'),
      region: this.configService.get('AWS_REGION', 'eu-west-1'),
      endpoint: this.configService.get('S3_ENDPOINT', 'http://localhost:9000'), // MinIO for local dev
      s3ForcePathStyle: true, // For MinIO compatibility
    });
  }

  generatePresignedPost(
    fileType: string,
    fileName: string,
    folder: 'profiles' | 'portfolios' | 'documents' | 'jobs'
  ): PresignedPostData {
    // Validate file type
    this.validateFileType(fileType, folder);

    // Generate unique filename
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    // For development, return mock presigned URL
    const mockPresignedPost = {
      url: `${this.configService.get('CDN_URL', 'http://localhost:9000')}/${this.bucketName}`,
      fields: {
        key,
        'Content-Type': fileType,
        bucket: this.bucketName,
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential': 'dev-credential',
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, ''),
        Policy: 'mock-policy',
        'X-Amz-Signature': 'mock-signature',
      },
      fileUrl: `${this.configService.get('CDN_URL', 'http://localhost:9000')}/${this.bucketName}/${key}`,
    };

    return mockPresignedPost;

    // Production code would use:
    // const params = {
    //   Bucket: this.bucketName,
    //   Key: key,
    //   Expires: 300, // 5 minutes
    //   Conditions: [
    //     ['content-length-range', 0, 10485760], // 10MB max
    //     ['starts-with', '$Content-Type', fileType.split('/')[0]],
    //   ],
    //   Fields: {
    //     'Content-Type': fileType,
    //   },
    // };

    // return this.s3.createPresignedPost(params);
  }

  private validateFileType(fileType: string, folder: string): void {
    const allowedTypes: Record<string, string[]> = {
      profiles: ['image/jpeg', 'image/png', 'image/webp'],
      portfolios: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/mov', 'video/avi'
      ],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      jobs: ['image/jpeg', 'image/png', 'image/webp']
    };

    if (!allowedTypes[folder] || !allowedTypes[folder].includes(fileType)) {
      throw new BadRequestException(`File type ${fileType} not allowed for ${folder}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from file URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      // For development, just log the deletion
      console.log(`Would delete file: ${key}`);

      // Production code would use:
      // await this.s3.deleteObject({
      //   Bucket: this.bucketName,
      //   Key: key,
      // }).promise();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  async getFileInfo(fileUrl: string): Promise<any> {
    try {
      // Extract key from file URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      // For development, return mock file info
      return {
        key,
        size: 1024000, // Mock 1MB
        lastModified: new Date(),
        contentType: 'image/jpeg',
      };

      // Production code would use:
      // return await this.s3.headObject({
      //   Bucket: this.bucketName,
      //   Key: key,
      // }).promise();
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new BadRequestException('Failed to get file info');
    }
  }
}
