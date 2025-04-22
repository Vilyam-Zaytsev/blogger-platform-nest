import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { BcryptService } from './bcrypt.service';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private bcryptService: BcryptService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    const { email, login, password, isConfirmed } = dto;

    const passwordHash: string =
      await this.bcryptService.generateHash(password);

    const candidate: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
      isConfirmed,
    };

    const user: UserDocument = this.UserModel.createInstance(candidate);

    return await this.usersRepository.save(user);
  }
}
