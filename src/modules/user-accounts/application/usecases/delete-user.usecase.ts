import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { IdInputDto } from '../../api/input-dto/id.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public dto: IdInputDto) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ dto }: DeleteUserCommand): Promise<string> {
    const user: UserDocument = await this.usersRepository.getByIdOrNotFoundFail(
      dto.id,
    );

    user.makeDeleted();

    return await this.usersRepository.save(user);
  }
}
