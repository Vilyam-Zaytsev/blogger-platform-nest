import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(id: string): Promise<string> {
    const user: UserDocument =
      await this.usersRepository.getByIdOrNotFoundFail(id);

    user.makeDeleted();

    return await this.usersRepository.save(user);
  }
}
