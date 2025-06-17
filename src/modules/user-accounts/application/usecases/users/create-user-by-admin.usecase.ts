import { UsersRepository } from '../../../infrastructure/users.repository';
import { UserDocument } from '../../../domain/entities/user/user.entity';
import { CreateUserDto } from '../../../dto/create-user.dto';
import { UsersFactory } from '../../factories/users.factory';
import { UserValidationService } from '../../services/user-validation.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateUserCommand {
  constructor(public readonly dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserByAdminUseCase
  implements ICommandHandler<CreateUserCommand>
{
  constructor(
    private readonly userValidation: UserValidationService,
    private readonly usersRepository: UsersRepository,
    private readonly userFactory: UsersFactory,
  ) {}

  async execute({ dto }: CreateUserCommand): Promise<string> {
    await this.userValidation.validateUniqueUser(dto);

    const user: UserDocument = await this.userFactory.create(dto);

    user.confirmEmail();

    return await this.usersRepository.save(user);
  }
}
