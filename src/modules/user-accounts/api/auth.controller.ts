import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { CommandBus } from '@nestjs/cqrs';
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
import { LoginValidationGuard } from '../guards/login-validation.guard';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { LoginViewDto } from './view-dto/login.view-dto';
import { PasswordRecoveryCommand } from '../application/usecases/password-recovery.usecase';

@Controller('auth')
export class AuthController {
  constructor(private commandBus: CommandBus) {}

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
  //TODO: правильно ли я валидирую входные данные?
  @UseGuards(LoginValidationGuard, LocalAuthGuard)
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

  async newPassword() {}

  async me() {}
}
