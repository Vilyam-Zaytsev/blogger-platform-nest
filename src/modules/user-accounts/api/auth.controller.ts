import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/register-user.useсase';
import { RegistrationConfirmationCodeInputDto } from './input-dto/registration-confirmation-code.input-dto';
import { ConfirmUserCommand } from '../application/usecases/confirm-user.usecase';
import { RegistrationEmailResandingInputDto } from './input-dto/registration-email-resending.input-dto';
import { ResendRegistrationEmailCommand } from '../application/usecases/resend-registration-email.usecase';

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

  async login() {}

  async logout() {}

  async passwordRecovery() {}

  async newPassword() {}

  async me() {}
}
