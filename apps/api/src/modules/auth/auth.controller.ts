import { 
  Controller, 
  Post, 
  Get,
  Query,
  Body, 
  UseGuards, 
  Request,
  Ip,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  EmailVerificationDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  RefreshTokenDto 
} from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
@SkipThrottle()
export class AuthController {
  constructor(private authService: AuthService) {}


  @Public()
  @SkipThrottle()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res() res: any,
  ) {
    // Validate required consents
    if (!registerDto.consents?.acceptedTerms || !registerDto.consents?.acceptedPrivacy) {
      throw new BadRequestException('CONSENTS_REQUIRED');
    }

    registerDto.ipAddress = ipAddress;
    registerDto.userAgent = userAgent;
    const result = await this.authService.register(registerDto, ipAddress);
    
    // Set JWT cookies
    res.cookie('accessToken', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    
    return res.json(result);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 15 * 60 * 1000 } }) // 10 attempts per 15 minutes
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verificationDto: EmailVerificationDto) {
    return this.authService.verifyEmail(verificationDto);
  }

  @Public()
  @SkipThrottle()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string, @Res() res: any) {
    // Rate limiting için IP ve email kombinasyonu logla
    console.log(`[LOGIN_ATTEMPT] IP: ${ipAddress} | Email: ${loginDto.email} | Timestamp: ${new Date().toISOString()}`);
    console.log(`[LOGIN_ATTEMPT] LoginDto:`, loginDto);
    try {
      const result = await this.authService.login(loginDto);
      console.log(`[LOGIN_ATTEMPT] Login successful for: ${loginDto.email}`);
      
      // Set JWT cookies
      res.cookie('accessToken', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.cookie('refreshToken', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      
      return res.json(result);
    } catch (error) {
      console.error(`[LOGIN_ATTEMPT] Login failed for: ${loginDto.email}`, error.message);
      throw error;
    }
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 15 * 60 * 1000 } }) // 10 attempts per 15 minutes
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto);
  }

  @Public()
  @Throttle({ auth: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 attempts per hour
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Throttle({ auth: { limit: 3, ttl: 60 * 60 * 1000 } }) // 3 attempts per hour
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Get('exists')
  @HttpCode(HttpStatus.OK)
  async checkEmailExists(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.checkEmailExists(email);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: false }) res: Response) {
    // Clear JWT cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    return res.json({ message: 'Logged out successfully' });
  }
}
