import { CreateUserDto } from '../dto/create-user.dto';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { BcryptService } from './bcrypt.service';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersFactory {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly bcryptService: BcryptService,
  ) {}
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const { email, login, password } = dto;

    const passwordHash: string =
      await this.bcryptService.generateHash(password);

    const confirmationCode: string = randomUUID();

    const expirationDate: Date = add(new Date(), { hours: 1, minutes: 1 });

    const user: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
      confirmationCode,
      expirationDate,
    };

    return this.UserModel.createInstance(user);
  }
}
