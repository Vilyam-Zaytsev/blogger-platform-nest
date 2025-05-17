import { RegistrationConfirmationCodeInputDto } from '../../api/input-dto/registration-confirmation-code.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';

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
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Confirmation code (${dto.code}) incorrect or the email address has already been confirmed`,
      });
    }

    user.confirmEmail();
    await this.usersRepository.save(user);
  }
}
