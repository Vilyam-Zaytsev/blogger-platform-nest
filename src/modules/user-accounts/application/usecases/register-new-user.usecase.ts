import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../users.factory';

@Injectable()
export class RegisterNewUserUseCase {
  constructor(
    @InjectModel(User.name)
    private readonly usersRepository: UsersRepository,
    private readonly usersFactory: UsersFactory,
  ) {}

  async execute(dto: CreateUserDto): Promise<string> {
    const user: UserDocument = await this.usersFactory.create(dto);

    //TODO: отправить письмо

    return await this.usersRepository.save(user);
  }
}
