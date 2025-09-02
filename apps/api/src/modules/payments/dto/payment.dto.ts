import { IsString, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  planId: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class PaymentWebhookDto {
  @IsString()
  eventType: string;

  @IsString()
  paymentId: string;

  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(['COMPLETED', 'FAILED', 'PENDING', 'CANCELLED'])
  status: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  signature?: string;
}
