import { UsersRepository } from '../../../infrastructure/users.repository';
import { UserDocument } from '../../../domain/entities/user/user.entity';
import { IdInputDto } from '../../../../../core/types/id.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public readonly dto: IdInputDto) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ dto }: DeleteUserCommand): Promise<string> {
    const user: UserDocument = await this.usersRepository.getByIdOrNotFoundFail(
      dto.id,
    );

    user.delete();

    return await this.usersRepository.save(user);
  }
}
