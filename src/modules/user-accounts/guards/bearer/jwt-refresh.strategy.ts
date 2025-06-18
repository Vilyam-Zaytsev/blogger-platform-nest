import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { PayloadRefreshToken } from '../../application/types/payload-refresh-token.type';
import { SessionContextDto } from '../dto/session-context.dto';
import { ICookieRequest } from '../../../../core/types/cookie-request.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly userAccountConfig: UserAccountsConfig) {
    const secret: string = userAccountConfig.refreshTokenSecret;

    if (!secret) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ICookieRequest): string | null =>
          req.cookies.refreshToken ?? null,
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: PayloadRefreshToken): SessionContextDto {
    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
    };
  }
}
