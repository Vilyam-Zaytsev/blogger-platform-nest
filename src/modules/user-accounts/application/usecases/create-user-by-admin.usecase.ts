import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../users.factory';

@Injectable()
export class CreateUserByAdminUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userFactory: UsersFactory,
  ) {}

  async execute(dto: CreateUserDto): Promise<string> {
    const user: UserDocument = await this.userFactory.create(dto);

    user.confirmByAdmin();

    return await this.usersRepository.save(user);
  }
}
