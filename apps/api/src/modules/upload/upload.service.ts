import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PresignDto } from './upload.dto';

export interface PresignedPostData {
  uploadUrl: string;
  fields: Record<string, string>;
  key: string;
  fileUrl: string;
}

export interface PresignedPutData {
  type: 'PUT';
  putUrl: string;
  key: string;
  fileUrl: string;
  contentType: string;
}

@Injectable()
export class UploadService {
  // Internal client: API -> MinIO/S3 (container network)
  private s3Internal: AWS.S3;
  // Presign client: generates URLs for the browser (public host)
  private s3Presign: AWS.S3;
  private bucketName: string;
  private cdnUrl: string;
  private publicUrl: string;
  private readonly log = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET', 'castlyo-dev');
    this.cdnUrl = this.configService.get<string>('CDN_URL', 'http://localhost:9000');
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL', 'http://localhost:9000');

    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const internalEndpoint = this.configService.get<string>('S3_ENDPOINT'); // http://minio:9000
    const publicEndpoint = this.publicUrl; // http://localhost:9000

    this.s3Internal = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
      endpoint: internalEndpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });

    this.s3Presign = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region,
      endpoint: publicEndpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
  }

  async generatePresignedPost(
    fileType: string,
    fileName: string,
    folder: 'profiles' | 'portfolios' | 'documents' | 'jobs'
  ): Promise<PresignedPostData> {
    this.validateFileType(fileType, folder);

    try {
      const ext = (fileName.split('.').pop() || 'bin').toLowerCase();
      const key = `${folder}/${uuidv4()}.${ext}`;

      const params: AWS.S3.PresignedPost.Params = {
        Bucket: this.bucketName,
        Expires: 60,
        Fields: { 
          key, 
          'Content-Type': fileType 
        },
        Conditions: [
          ['eq', '$Content-Type', fileType],
          ['starts-with', '$key', `${folder}/`],
          ['content-length-range', 0, 5 * 1024 * 1024],
        ],
      };

      const { url, fields } = await this.s3Presign.createPresignedPost(params);

      // Tarayıcı public URL kullanmalı
      const uploadUrl = `${(this.publicUrl || url).replace(/\/$/, '')}/${this.bucketName}`;
      const fileUrl = `${this.publicUrl}/${this.bucketName}/${key}`;

      // Debug logging
      this.log.debug('Generated presigned URL:', {
        publicUrl: this.publicUrl,
        bucketName: this.bucketName,
        key,
        uploadUrl,
        fileUrl
      });

      return {
        uploadUrl,         // örn: http://localhost:9000/castlyo-dev
        fields,            // SDK'nın ürettiği X-Amz-* alanları
        key,
        fileUrl,
      };
    } catch (err) {
      this.log.error('presign failed', err as any);
      throw new BadRequestException('PRESIGN_FAILED');
    }
  }

  async presignPut(dto: PresignDto): Promise<PresignedPutData> {
    this.validateFileType(dto.fileType, dto.folder);

    try {
      const ext = (dto.fileName.split('.').pop() || 'bin').toLowerCase();
      const key = `${dto.folder}/${uuidv4()}.${ext}`;

      const putUrl = await this.s3Presign.getSignedUrlPromise('putObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: 60,
        ContentType: dto.fileType,
      });

      const fileUrl = `${this.publicUrl}/${this.bucketName}/${key}`;

      this.log.debug('Generated presigned PUT URL:', {
        bucketName: this.bucketName,
        key,
        putUrl,
        fileUrl,
      });

      return {
        type: 'PUT',
        putUrl,
        key,
        fileUrl,
        contentType: dto.fileType,
      };
    } catch (err) {
      this.log.error('presign PUT failed', err as any);
      throw new BadRequestException('PRESIGN_PUT_FAILED');
    }
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
