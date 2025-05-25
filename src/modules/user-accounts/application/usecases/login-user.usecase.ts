import { UserContextDto } from '../../guards/dto/user-context.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../services/crypto.service';
import { AuthTokens } from '../../types/auth-tokens.type';

export class LoginUserCommand {
  constructor(public dto: UserContextDto) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,

    private readonly cryptoService: CryptoService,
  ) {}

  async execute({ dto }: LoginUserCommand): Promise<AuthTokens> {
    const accessToken: string = this.accessTokenContext.sign({
      id: dto.id,
    });

    const deviceId: string = this.cryptoService.generateUUID();

    const refreshToken: string = this.refreshTokenContext.sign({
      id: dto.id,
      deviceId,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
