import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from './subscriptions.service';
import { CreateCheckoutSessionDto, PaymentWebhookDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // Subscription Plans
  @Public()
  @Get('plans')
  async getSubscriptionPlans(@Query('userType') userType?: 'TALENT' | 'AGENCY') {
    return this.subscriptionsService.getAvailablePlans(userType);
  }

  // Checkout & Payments
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async createCheckoutSession(
    @Request() req,
    @Body() checkoutData: CreateCheckoutSessionDto
  ) {
    return this.paymentsService.createCheckoutSession(req.user.id, checkoutData);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(@Body() webhookData: PaymentWebhookDto) {
    return this.paymentsService.handlePaymentWebhook(webhookData);
  }

  // Payment History
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getPaymentHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.paymentsService.getPaymentHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions/:id')
  async getTransactionDetails(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.paymentsService.getTransactionDetails(id, req.user.id);
  }

  // Subscriptions
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getActiveSubscription(@Request() req) {
    return this.subscriptionsService.getUserActiveSubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscriptions')
  async getSubscriptionHistory(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.subscriptionsService.getUserSubscriptionHistory(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('subscription/:id/cancel')
  async cancelSubscription(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, id);
  }

  // Entitlements
  @UseGuards(JwtAuthGuard)
  @Get('entitlements')
  async getUserEntitlements(@Request() req) {
    return this.subscriptionsService.getUserEntitlements(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('entitlements/:type')
  async checkEntitlement(
    @Param('type') type: string,
    @Request() req
  ) {
    return this.subscriptionsService.checkEntitlement(req.user.id, type);
  }

  // Development endpoints
  @Post('mock/complete/:transactionId')
  @HttpCode(HttpStatus.OK)
  async mockCompletePayment(@Param('transactionId') transactionId: string) {
    return this.paymentsService.mockCompletePayment(transactionId);
  }
}
