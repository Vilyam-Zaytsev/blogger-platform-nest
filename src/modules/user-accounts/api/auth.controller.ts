import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/auth/register-user.useсase';
import { RegistrationConfirmationCodeInputDto } from './input-dto/authentication-authorization/registration-confirmation-code.input-dto';
import { ConfirmUserCommand } from '../application/usecases/users/confirm-user.usecase';
import { RegistrationEmailResandingInputDto } from './input-dto/authentication-authorization/registration-email-resending.input-dto';
import { ResendRegistrationEmailCommand } from '../application/usecases/auth/resend-registration-email.usecase';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { LoginUserCommand } from '../application/usecases/auth/login-user.usecase';
import { AuthTokens } from '../types/auth-tokens.type';
import { Request, Response } from 'express';
import { PasswordRecoveryInputDto } from './input-dto/authentication-authorization/password-recovery.input-dto';
import { LoginViewDto } from './view-dto/login.view-dto';
import { PasswordRecoveryCommand } from '../application/usecases/auth/password-recovery.usecase';
import { NewPasswordInputDto } from './input-dto/authentication-authorization/new-password-input.dto';
import { NewPasswordCommand } from '../application/usecases/auth/new-password.usecase';
import { MeViewDto } from './view-dto/user.view-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { GetMeQuery } from '../application/queries/auth/get-me.query-handler';
import { parseUserAgent } from '../../../core/utils/parse-user-agent.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() body: UserInputDto): Promise<void> {
    return this.commandBus.execute(new RegisterUserCommand(body));
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() body: RegistrationConfirmationCodeInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new ConfirmUserCommand(body));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() body: RegistrationEmailResandingInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new ResendRegistrationEmailCommand(body));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<LoginViewDto> {
    const userAgent: string = req.headers['user-agent'] || '';
    const ip: string =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    const { accessToken, refreshToken }: AuthTokens =
      await this.commandBus.execute(new LoginUserCommand(user, userAgent, ip));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 120000,
      path: '/',
    });

    return { accessToken };
  }

  async logout() {}

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() body: PasswordRecoveryInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new PasswordRecoveryCommand(body));
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() body: NewPasswordInputDto): Promise<void> {
    return this.commandBus.execute(new NewPasswordCommand(body));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.queryBus.execute(new GetMeQuery(user.id));
  }
}
