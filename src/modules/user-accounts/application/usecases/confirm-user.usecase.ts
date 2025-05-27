import { RegistrationConfirmationCodeInputDto } from '../../api/input-dto/authentication-authorization/registration-confirmation-code.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';
import { ValidationException } from '../../../../core/exceptions/validation-exception';

export class ConfirmUserCommand {
  constructor(public readonly dto: RegistrationConfirmationCodeInputDto) {}
}

@CommandHandler(ConfirmUserCommand)
export class ConfirmUserUseCase implements ICommandHandler<ConfirmUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ dto }: ConfirmUserCommand): Promise<void> {
    const user: UserDocument | null =
      await this.usersRepository.getByConfirmationCode(dto.code);

    if (
      !user ||
      !user.emailConfirmation.confirmationCode ||
      !user.emailConfirmation.expirationDate ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.confirmationStatus === ConfirmationStatus.Confirmed
    ) {
      //TODO: как лучше формировать extensions? Так как у меня или через new Extension(message, field)?

      throw new ValidationException([
        {
          message: `Confirmation code (${dto.code}) incorrect or the email address has already been confirmed`,
          field: 'code',
        },
      ]);
    }

    user.confirmEmail();
    await this.usersRepository.save(user);
  }
}
