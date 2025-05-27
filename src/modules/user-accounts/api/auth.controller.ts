import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/register-user.useсase';
import { RegistrationConfirmationCodeInputDto } from './input-dto/authentication-authorization/registration-confirmation-code.input-dto';
import { ConfirmUserCommand } from '../application/usecases/confirm-user.usecase';
import { RegistrationEmailResandingInputDto } from './input-dto/authentication-authorization/registration-email-resending.input-dto';
import { ResendRegistrationEmailCommand } from '../application/usecases/resend-registration-email.usecase';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { AuthTokens } from '../types/auth-tokens.type';
import { Response } from 'express';
import { PasswordRecoveryInputDto } from './input-dto/authentication-authorization/password-recovery.input-dto';
import { LoginViewDto } from './view-dto/login.view-dto';
import { PasswordRecoveryCommand } from '../application/usecases/password-recovery.usecase';
import { NewPasswordInputDto } from './input-dto/authentication-authorization/new-password-input.dto';
import { NewPasswordCommand } from '../application/usecases/new-password.usecase';
import { MeViewDto } from './view-dto/user.view-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { GetMeQuery } from '../application/queries/auth/get-me.query-handler';

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
  ): Promise<LoginViewDto> {
    const { accessToken, refreshToken }: AuthTokens =
      await this.commandBus.execute(new LoginUserCommand(user));

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
