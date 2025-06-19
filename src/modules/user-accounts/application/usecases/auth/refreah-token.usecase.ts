import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { PayloadRefreshToken } from '../../types/payload-refresh-token.type';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { SessionDocument } from '../../../domain/entities/session/session.entity';
import { AuthTokens } from '../../../types/auth-tokens.type';

export class RefreshTokenCommand {
  constructor(public readonly dto: SessionContextDto) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,

    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute({ dto }: RefreshTokenCommand): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.accessTokenContext.sign(dto.userId),
      this.refreshTokenContext.sign({
        userId: dto.userId,
        deviceId: dto.deviceId,
      }),
    ]);

    const { iat, exp }: PayloadRefreshToken =
      this.refreshTokenContext.decode<PayloadRefreshToken>(refreshToken);

    const session: SessionDocument | null =
      await this.sessionsRepository.getByDeviceId(dto.deviceId);

    session!.updateTimestamps(iat, exp);

    await this.sessionsRepository.save(session!);

    return {
      accessToken,
      refreshToken,
    };
  }
}
