import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';
import { RegistrationEmailResandingInputDto } from '../../api/input-dto/authentication-authorization/registration-email-resending.input-dto';
import { add } from 'date-fns';
import { CryptoService } from '../services/crypto.service';
import { UserResendRegisteredEvent } from '../../domain/events/user-resend-registered.event';
import { ValidationException } from '../../../../core/exceptions/validation-exception';

export class ResendRegistrationEmailCommand {
  constructor(public readonly dto: RegistrationEmailResandingInputDto) {}
}

@CommandHandler(ResendRegistrationEmailCommand)
export class ResendRegistrationEmailUseCase
  implements ICommandHandler<ResendRegistrationEmailCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ dto }: ResendRegistrationEmailCommand): Promise<void> {
    const user: UserDocument | null = await this.usersRepository.getByEmail(
      dto.email,
    );

    if (
      !user ||
      user.emailConfirmation.confirmationStatus === ConfirmationStatus.Confirmed
    ) {
      //TODO: как лучше формировать extensions? Так как у меня или через new Extension(message, field)?
      throw new ValidationException([
        {
          message: `The email address (${dto.email}) is incorrect or has already been verified`,
          field: 'email',
        },
      ]);
    }

    const confirmationCode: string = this.cryptoService.generateUUID();
    const expirationDate: Date = add(new Date(), { hours: 1, minutes: 1 });

    user.refreshConfirmationCode(confirmationCode, expirationDate);
    await this.usersRepository.save(user);

    this.eventBus.publish(
      new UserResendRegisteredEvent(user.email, confirmationCode),
    );
  }
}
