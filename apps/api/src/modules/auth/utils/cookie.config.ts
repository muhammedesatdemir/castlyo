import { ConfigService } from '@nestjs/config';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  maxAge?: number;
}

export class CookieConfigService {
  constructor(private configService: ConfigService) {}

  getAccessTokenCookieOptions(): CookieOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieSecure = this.configService.get('COOKIE_SECURE', isProduction ? 'true' : 'false') === 'true';
    const cookieSameSite = this.configService.get('COOKIE_SAMESITE', isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');
    const accessTokenTTL = this.configService.get('ACCESS_TOKEN_TTL', '15m');
    
    // Convert TTL to milliseconds
    const maxAge = this.parseTTLToMs(accessTokenTTL);

    return {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain || undefined,
      maxAge,
    };
  }

  getRefreshTokenCookieOptions(): CookieOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieSecure = this.configService.get('COOKIE_SECURE', isProduction ? 'true' : 'false') === 'true';
    const cookieSameSite = this.configService.get('COOKIE_SAMESITE', isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');
    const refreshTokenTTL = this.configService.get('REFRESH_TOKEN_TTL', '14d');
    
    // Convert TTL to milliseconds
    const maxAge = this.parseTTLToMs(refreshTokenTTL);

    return {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain || undefined,
      maxAge,
    };
  }

  getClearCookieOptions(): Omit<CookieOptions, 'maxAge'> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const cookieSecure = this.configService.get('COOKIE_SECURE', isProduction ? 'true' : 'false') === 'true';
    const cookieSameSite = this.configService.get('COOKIE_SAMESITE', isProduction ? 'none' : 'lax') as 'strict' | 'lax' | 'none';
    const cookieDomain = this.configService.get('COOKIE_DOMAIN');

    return {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
      domain: cookieDomain || undefined,
    };
  }

  getAccessTokenCookieName(): string {
    return this.configService.get('COOKIE_NAME', 'castlyo_at');
  }

  getRefreshTokenCookieName(): string {
    return this.configService.get('REFRESH_COOKIE_NAME', 'castlyo_rt');
  }

  private parseTTLToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 15 minutes if invalid format
      return 15 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
}
