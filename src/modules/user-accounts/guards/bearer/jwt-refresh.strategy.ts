import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { PayloadRefreshToken } from '../../application/types/payload-refresh-token.type';
import { SessionContextDto } from '../dto/session-context.dto';
import { ICookieRequest } from '../../../../core/types/cookie-request.interface';
import { SessionsRepository } from '../../infrastructure/sessions.repository';
import { SessionDocument } from '../../domain/entities/session/session.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly userAccountConfig: UserAccountsConfig,
    private readonly sessionsRepository: SessionsRepository,
  ) {
    const secret: string = userAccountConfig.refreshTokenSecret;

    if (!secret) {
      throw new Error(
        'REFRESH_TOKEN_SECRET is not defined in environment variables',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: ICookieRequest): string | null =>
          req.cookies?.refreshToken ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: PayloadRefreshToken): Promise<SessionContextDto> {
    const { userId, deviceId, iat } = payload;
    const tokenIssuedDate: Date = new Date(iat * 1000);

    const session: SessionDocument | null =
      await this.sessionsRepository.getByDeviceId(deviceId);

    if (!session || session.iat.getTime() !== tokenIssuedDate.getTime()) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: `Unauthorized`,
      });
    }

    return {
      userId,
      deviceId,
    };
  }
}
