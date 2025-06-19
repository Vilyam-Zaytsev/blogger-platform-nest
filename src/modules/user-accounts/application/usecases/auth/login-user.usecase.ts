import { UserContextDto } from '../../../guards/dto/user-context.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../../services/crypto.service';
import { AuthTokens } from '../../../types/auth-tokens.type';
import { PayloadRefreshToken } from '../../types/payload-refresh-token.type';
import { CreateSessionDto } from '../../../dto/create-session.dto';
import { CreateSessionCommand } from '../sessions/create-session.usecase';

export class LoginUserCommand {
  constructor(
    public readonly user: UserContextDto,
    public readonly userAgent: string,
    public readonly ip: string,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenContext: JwtService,

    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,

    private readonly cryptoService: CryptoService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({
    user,
    userAgent,
    ip,
  }: LoginUserCommand): Promise<AuthTokens> {
    const accessToken: string = this.accessTokenContext.sign({
      id: user.id,
    });

    const deviceId: string = this.cryptoService.generateObjectId().toString();
    const refreshToken: string = this.refreshTokenContext.sign({
      userId: user.id,
      deviceId,
    });

    const { iat, exp }: PayloadRefreshToken =
      this.refreshTokenContext.decode<PayloadRefreshToken>(refreshToken);

    const createSessionDto: CreateSessionDto = {
      userId: user.id,
      deviceId,
      userAgent,
      ip,
      iat,
      exp,
    };

    await this.commandBus.execute(new CreateSessionCommand(createSessionDto));

    return {
      accessToken,
      refreshToken,
    };
  }
}
