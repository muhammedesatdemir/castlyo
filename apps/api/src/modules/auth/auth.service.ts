import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException,
  InternalServerErrorException,
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
import { ConsentDto } from './dto/auth.dto';
import { eq } from 'drizzle-orm';

// Prisma error code helper
const isUniqueViolation = (e: any) =>
  e?.code === "P2002" || e?.meta?.cause?.includes?.("Unique") || e?.message?.includes?.("unique");

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
    
    if (!email || !password) {
      this.logger.warn(`[VALIDATE_USER] Missing email or password`);
      throw new BadRequestException('Email and password are required');
    }
    
    try {
      const user = await this.usersService.findByEmail(email);
      this.logger.log(`[VALIDATE_USER] User found: ${!!user}, Status: ${user?.status}, EmailVerified: ${user?.emailVerified}`);
      
      if (user && user.passwordHash) {
        // Guard against undefined password hash
        if (!user.passwordHash) {
          this.logger.error(`[VALIDATE_USER] User ${user.id} has no password hash`);
          throw new InternalServerErrorException('User authentication data is corrupted');
        }
        
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
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`[VALIDATE_USER] Database error during validation: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Authentication service temporarily unavailable');
    }
  }

  async register(registerDto: RegisterDto, ip?: string) {
    this.logger.log(`[REGISTER] Starting registration for email: ${registerDto.email}`);
    
    // Validate input
    if (!registerDto.email || !registerDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    if (registerDto.password !== registerDto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    if (!registerDto?.consents?.acceptedTerms || !registerDto?.consents?.acceptedPrivacy) {
      throw new BadRequestException('Required consents must be accepted');
    }

    try {
      // Check if email already exists
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // 1) Atomik: user + consents tek transaction
      const { user } = await this.db.transaction(async (tx: any) => {
        // Hash password with proper error handling
        const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS', 10));
        let passwordHash: string;
        
        try {
          passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
        } catch (hashError) {
          this.logger.error(`[REGISTER] Password hashing failed: ${hashError.message}`, hashError.stack);
          throw new InternalServerErrorException('Password processing failed');
        }
        
        this.logger.debug(`[REGISTER] Password hashed for email: ${registerDto.email}`);

        // Check if email verification is enabled
        const emailVerificationEnabled = this.configService.get('ENABLE_EMAIL_VERIFICATION', 'true') === 'true';
        
        // Create user
        const user = await tx.insert(users).values({
          email: registerDto.email.toLowerCase().trim(),
          passwordHash,
          role: registerDto.role,
          status: emailVerificationEnabled ? 'PENDING' : 'ACTIVE',
          emailVerified: !emailVerificationEnabled,
        }).returning();

        // Insert terms consent
        await tx.insert(userConsents).values({
          userId: user[0].id,
          consentType: 'TERMS',
          version: registerDto.consents.termsVersion || '1.0',
          consented: true,
          ipAddress: ip ?? null,
          userAgent: registerDto.userAgent ?? null,
        });

        // Insert privacy consent
        await tx.insert(userConsents).values({
          userId: user[0].id,
          consentType: 'PRIVACY',
          version: registerDto.consents.privacyVersion || '1.0',
          consented: true,
          ipAddress: ip ?? null,
          userAgent: registerDto.userAgent ?? null,
        });

        return { user: user[0] };
      });

      // 2) Yan etkiler (kritik değil) → başarısız olsa bile kullanıcıya 201 döneceğiz
      try {
        this.logger.log(`[REGISTER] User registered successfully: ${user.id} | Email: ${registerDto.email} | Role: ${registerDto.role}`);
      } catch (sideErr) {
        this.logger.warn({ msg: "register side-effect failed", sideErr });
        // intentionally swallow
      }

      // 3) Tokenlar ve response
      const tokens = await this.generateTokens(user);
      return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };

    } catch (error: any) {
      // Handle known errors
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }

      // Handle database constraint violations
      if (error?.code === "23505" || error?.constraint?.includes("unique")) {
        throw new ConflictException('Email already exists');
      }

      // Log detailed error information for debugging
      this.logger.error(`[REGISTER] Registration failed for ${registerDto.email}`, {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
        stack: error.stack,
        email: registerDto.email,
      });

      throw new InternalServerErrorException('Registration service temporarily unavailable');
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

    } catch (error: any) {
      // Handle known errors
      if (error instanceof UnauthorizedException || 
          error instanceof BadRequestException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }

      // Log detailed error information for debugging
      this.logger.error(`[LOGIN] Login failed for email: ${loginDto.email}`, {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
        stack: error.stack,
        email: loginDto.email,
      });

      throw new InternalServerErrorException('Authentication service temporarily unavailable');
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
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
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

  // Record user consents with version tracking
  private async recordUserConsents(userId: string, consents: ConsentDto, ipAddress?: string) {
    try {
      await this.db.insert(userConsents).values({
        userId,
        acceptedTerms: consents.acceptedTerms,
        acceptedPrivacy: consents.acceptedPrivacy,
        termsVersion: consents.termsVersion,
        privacyVersion: consents.privacyVersion,
        acceptedIp: ipAddress || null,
      });
      this.logger.log(`[recordUserConsents] Successfully recorded consents for user: ${userId}`);
    } catch (error) {
      this.logger.error(`[recordUserConsents] Failed to record consents`, error);
      throw error;
    }
  }

  async checkEmailExists(email: string) {
    try {
      const existingUser = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      return { 
        exists: existingUser.length > 0,
        email: email.toLowerCase().trim()
      };
    } catch (error: any) {
      // Log detailed error information for debugging
      this.logger.error(`[checkEmailExists] Failed to check email existence for ${email}`, {
        error: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack,
        email,
      });
      
      throw new InternalServerErrorException('Email check service temporarily unavailable');
    }
  }

  // Record user consents - support both old and new signature (legacy)
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
