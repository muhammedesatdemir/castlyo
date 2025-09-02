import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  Inject 
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { 
  LoginDto, 
  RegisterDto, 
  EmailVerificationDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  RefreshTokenDto 
} from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { users, userConsents } from '@packages/database/schema/users';
import { eq } from 'drizzle-orm';
import type { Database } from '@packages/database';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    // Check if passwords match
    if (registerDto.password !== registerDto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check KVKK consent
    if (!registerDto.kvkkConsent) {
      throw new BadRequestException('KVKK consent is required');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const newUser = await this.db.insert(users).values({
      email: registerDto.email.toLowerCase(),
      phone: registerDto.phone,
      passwordHash,
      role: registerDto.role,
      status: 'PENDING', // User needs email verification
    }).returning();

    const userId = newUser[0].id;

    // Record consents
    await this.recordConsents(userId, registerDto);

    // Generate email verification token
    const verificationToken = this.generateEmailVerificationToken(userId);

    // TODO: Send verification email

    return {
      message: 'Registration successful. Please check your email for verification.',
      userId,
      verificationToken, // Remove this in production
    };
  }

  async verifyEmail(verificationDto: EmailVerificationDto) {
    try {
      const payload = this.jwtService.verify(verificationDto.token, {
        secret: this.configService.get('JWT_SECRET') + '_email_verification',
      });

      // Update user status
      await this.db.update(users)
        .set({ 
          status: 'ACTIVE',
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, payload.sub));

      return { message: 'Email verified successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      if (user.status === 'PENDING') {
        throw new UnauthorizedException('Please verify your email first');
      }
      throw new UnauthorizedException('Account is suspended');
    }

    // Update last login
    await this.db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    };
  }

  async refreshToken(refreshDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = this.generatePasswordResetToken(user.id);
    
    // TODO: Send password reset email
    
    return { 
      message: 'If the email exists, a reset link has been sent.',
      resetToken, // Remove this in production
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.password !== resetPasswordDto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      const payload = this.jwtService.verify(resetPasswordDto.token, {
        secret: this.configService.get('JWT_SECRET') + '_password_reset',
      });

      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
      const passwordHash = await bcrypt.hash(resetPasswordDto.password, saltRounds);

      await this.db.update(users)
        .set({ 
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, payload.sub));

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60, // 15 minutes in seconds
    };
  }

  private generateEmailVerificationToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_SECRET') + '_email_verification',
        expiresIn: '24h',
      }
    );
  }

  private generatePasswordResetToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_SECRET') + '_password_reset',
        expiresIn: '1h',
      }
    );
  }

  private async recordConsents(userId: string, registerDto: RegisterDto) {
    const consentsToRecord = [
      {
        userId,
        consentType: 'KVKK',
        version: '1.0',
        consented: registerDto.kvkkConsent,
        ipAddress: registerDto.ipAddress,
        userAgent: registerDto.userAgent,
      }
    ];

    if (registerDto.marketingConsent !== undefined) {
      consentsToRecord.push({
        userId,
        consentType: 'MARKETING',
        version: '1.0',
        consented: registerDto.marketingConsent,
        ipAddress: registerDto.ipAddress,
        userAgent: registerDto.userAgent,
      });
    }

    await this.db.insert(userConsents).values(consentsToRecord);
  }
}
