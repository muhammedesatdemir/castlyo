import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateMessageThreadDto {
  @IsUUID()
  participantId: string;

  @IsString()
  @MaxLength(1000)
  initialMessage: string;

  @IsOptional()
  @IsUUID()
  jobApplicationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;
}

export class SendMessageDto {
  @IsUUID()
  threadId: string;

  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsEnum(['TEXT', 'IMAGE', 'FILE'])
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class CreateContactPermissionRequestDto {
  @IsUUID()
  jobApplicationId: string;

  @IsString()
  @MaxLength(1000)
  requestMessage: string;
}

export class RespondToContactRequestDto {
  @IsEnum(['GRANTED', 'DENIED'])
  status: 'GRANTED' | 'DENIED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  responseMessage?: string;
}
