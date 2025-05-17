import { Body, Controller, Post } from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../application/usecases/register-user.useсase';
import { RegistrationConfirmationCodeInputDto } from './input-dto/registration-confirmation-code.input-dto';
import { ConfirmUserCommand } from '../application/usecases/confirm-user.usecase';

@Controller('auth')
export class AuthController {
  constructor(private commandBus: CommandBus) {}

  @Post('registration')
  async registration(@Body() body: UserInputDto): Promise<void> {
    return this.commandBus.execute(new RegisterUserCommand(body));
  }

  @Post('registration-confirmation')
  async registrationConfirmation(
    @Body() body: RegistrationConfirmationCodeInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new ConfirmUserCommand(body));
  }

  async registrationEmailResending() {}

  async login() {}

  async logout() {}

  async passwordRecovery() {}

  async newPassword() {}

  async me() {}
}
