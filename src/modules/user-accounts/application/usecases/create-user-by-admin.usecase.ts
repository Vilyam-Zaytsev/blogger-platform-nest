import { Injectable } from '@nestjs/common';
import { BcryptService } from '../bcrypt.service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';

@Injectable()
export class CreateUserByAdminUseCase {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private readonly bcryptService: BcryptService,
    private readonly usersRepository: UsersRepository,
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

    userDocument.emailConfirmation.confirmationStatus =
      ConfirmationStatus.Confirmed;

    return await this.usersRepository.save(userDocument);
  }
}
