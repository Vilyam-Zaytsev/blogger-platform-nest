import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { add } from 'date-fns';
import { CryptoService } from '../crypto.service';
import { PasswordRecoveryInputDto } from '../../api/input-dto/password-recovery.input-dto';
import { UserPasswordRecoveryEvent } from '../../domain/events/user-password-recovery.event';

export class PasswordRecoveryCommand {
  constructor(public readonly dto: PasswordRecoveryInputDto) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cryptoService: CryptoService,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ dto }: PasswordRecoveryCommand): Promise<void> {
    const user: UserDocument | null = await this.usersRepository.getByEmail(
      dto.email,
    );

    if (!user) return;

    const recoveryCode: string = this.cryptoService.generateUUID();
    const expirationDate: Date = add(new Date(), { hours: 1, minutes: 1 });

    user.recoverPassword(recoveryCode, expirationDate);

    await this.usersRepository.save(user);

    this.eventBus.publish(
      new UserPasswordRecoveryEvent(user.email, recoveryCode),
    );
  }
}
