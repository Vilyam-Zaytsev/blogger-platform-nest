import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../users.factory';
import { UserValidationService } from '../services/user-validation.service';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

export class RegisterUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly userValidation: UserValidationService,
    private readonly usersRepository: UsersRepository,
    private readonly usersFactory: UsersFactory,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ dto }: RegisterUserCommand): Promise<void> {
    await this.userValidation.validateUniqueUser(dto);
    const user: UserDocument = await this.usersFactory.create(dto);
    await this.usersRepository.save(user);

    const email: string = user.email;
    const confirmationCode: string = user.emailConfirmation.confirmationCode!;

    this.eventBus.publish(new UserRegisteredEvent(email, confirmationCode));
  }
}
