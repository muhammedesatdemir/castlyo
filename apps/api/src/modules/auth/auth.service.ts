import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  Inject,
  Logger 
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE } from '@/config/database.module';
import { UsersService } from '../users/users.service';
import { 
  LoginDto, 
  RegisterDto, 
  EmailVerificationDto, 
  ForgotPasswordDto, 
  ResetPasswordDto,
  RefreshTokenDto 
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { users, userConsents } from '@castlyo/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: any,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.log(`[VALIDATE_USER] Attempting validation for email: ${email}`);
    
    const user = await this.usersService.findByEmail(email);
    this.logger.log(`[VALIDATE_USER] User found: ${!!user}, Status: ${user?.status}, EmailVerified: ${user?.emailVerified}`);
    
    if (user) {
      this.logger.log(`[VALIDATE_USER] Password hash from DB: ${user.passwordHash}`);
      this.logger.log(`[VALIDATE_USER] Password to compare: ${password}`);
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      this.logger.log(`[VALIDATE_USER] Password match: ${passwordMatch}`);
      
      if (passwordMatch) {
        const { passwordHash, ...result } = user;
        this.logger.log(`[VALIDATE_USER] ✅ Validation successful for user: ${user.id}`);
        return result;
      }
    }
    
    this.logger.warn(`[VALIDATE_USER] ❌ Validation failed for email: ${email}`);
    return null;
  }

  async register(registerDto: RegisterDto) {
    this.logger.log(`[REGISTER] Starting registration for email: ${registerDto.email}`);
    
    try {
      // Check if passwords match
      if (registerDto.password !== registerDto.passwordConfirm) {
        this.logger.warn(`[REGISTER] Password mismatch for email: ${registerDto.email}`);
        throw new BadRequestException('Passwords do not match');
      }

      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        this.logger.warn(`[REGISTER] User already exists: ${registerDto.email}`);
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
      this.logger.debug(`[REGISTER] Password hashed for email: ${registerDto.email}`);

      // Check if email verification is enabled
      const emailVerificationEnabled = this.configService.get('ENABLE_EMAIL_VERIFICATION', 'true') === 'true';
      
      // Create user
      const user = await this.usersService.create({
        email: registerDto.email.toLowerCase(),
        passwordHash,
        role: registerDto.role,
        status: emailVerificationEnabled ? 'PENDING' : 'ACTIVE',
        emailVerified: !emailVerificationEnabled,
      });

      this.logger.log(`[REGISTER] User created successfully: ${user.id} | Email: ${registerDto.email} | Role: ${registerDto.role}`);

      // KVKK/Terms record: temporarily disabled due to consent service issues
      this.logger.log(`[REGISTER] KVKK: ${registerDto.kvkkConsent}, Terms: ${registerDto.termsConsent} (consent recording disabled)`);

      // Generate tokens
      const tokens = await this.issuePair(user.id, user.role);
      
      return { 
        success: true, 
        user: { id: user.id, email: user.email, role: user.role }, 
        ...tokens 
      };

    } catch (error) {
      this.logger.error(`[REGISTER] Registration failed for email: ${registerDto.email}`, error.stack);
      throw error;
    }
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
    this.logger.log(`[LOGIN] Login attempt for email: ${loginDto.email}`);
    
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        this.logger.warn(`[LOGIN] Invalid credentials for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        if (user.status === 'PENDING') {
          this.logger.warn(`[LOGIN] Email verification required for user: ${user.id} | Email: ${loginDto.email}`);
          throw new UnauthorizedException('Please verify your email first');
        }
        this.logger.warn(`[LOGIN] Account suspended for user: ${user.id} | Email: ${loginDto.email} | Status: ${user.status}`);
        throw new UnauthorizedException('Account is suspended');
      }

      // Update last login
      await this.db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const tokens = await this.generateTokens(user);
      this.logger.log(`[LOGIN] Login successful for user: ${user.id} | Email: ${loginDto.email} | Role: ${user.role}`);

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

    } catch (error) {
      this.logger.error(`[LOGIN] Login failed for email: ${loginDto.email}`, error.stack);
      throw error;
    }
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

      const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
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

  // Issue JWT token pair
  async issuePair(userId: string, role: string) {
    const payload = { sub: userId, role };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // Record user consents - support both old and new signature
  private async recordConsents(data: any) {
    let consentsToRecord = [];

    // Handle both old RegisterDto format and new structured format
    if (data.items) {
      // New format: { userId, items: [...], ipAddress, userAgent }
      consentsToRecord = data.items.map((item: any) => ({
        userId: data.userId,
        consentType: item.consentType.toUpperCase(),
        version: item.version,
        consented: item.consented,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }));
    } else {
      // Old format: (userId, registerDto)
      const userId = typeof data === 'string' ? data : data.userId;
      const registerDto = arguments[1] || data;
      
      consentsToRecord = [
        {
          userId,
          consentType: 'KVKK',
          version: '1.0',
          consented: registerDto.kvkkConsent,
          ipAddress: registerDto.ipAddress,
          userAgent: registerDto.userAgent,
        },
        {
          userId,
          consentType: 'TERMS',
          version: '1.0',
          consented: registerDto.termsConsent,
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
    }

    try {
      for (const consent of consentsToRecord) {
        await this.db.insert(userConsents).values(consent);
      }
      this.logger.log(`[recordConsents] Successfully recorded ${consentsToRecord.length} consents for user: ${consentsToRecord[0]?.userId}`);
    } catch (error) {
      this.logger.error(`[recordConsents] Failed to record consents`, error);
      throw error;
    }
  }
}
