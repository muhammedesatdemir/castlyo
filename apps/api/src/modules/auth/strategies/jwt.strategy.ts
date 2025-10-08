import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const cookieName = configService.get('COOKIE_NAME', 'castlyo_at');
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          // Extract JWT from cookies using configurable cookie name
          if (request.cookies && request.cookies[cookieName]) {
            return request.cookies[cookieName];
          }
          // Fallback to legacy cookie name for backward compatibility
          if (request.cookies && request.cookies.accessToken) {
            return request.cookies.accessToken;
          }
          return null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: any) {
    // Token: { sub, email, role }
    console.log('[JWT] payload.userId=', payload?.userId || payload?.sub);
    return { 
      id: payload.sub, 
      userId: payload.sub, // Controller'ların kullandığı field
      email: payload.email, 
      role: payload.role 
    };
  }
}
