import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { BcryptService } from '../bcrypt.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';

@Injectable()
export class RegisterNewUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    @InjectModel(User.name)
    private readonly UserModel: UserModelType,
  ) {}

  async execute(dto: CreateUserDto): Promise<string> {
    const { email, login, password } = dto;

    const passwordHash: string =
      await this.bcryptService.generateHash(password);

    const user: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
    };

    const userDocument: UserDocument = this.UserModel.createInstance(user);

    const confirmationCode: string = randomUUID();

    const expirationDate: Date = add(new Date(), { hours: 1, minutes: 1 });

    userDocument.emailConfirmation.confirmationCode = confirmationCode;
    userDocument.emailConfirmation.expirationDate = expirationDate;

    return await this.usersRepository.save(userDocument);
  }
}
