import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../users.factory';
import { UserValidationService } from '../user-validation.service';

@Injectable()
export class CreateUserByAdminUseCase {
  constructor(
    private readonly userValidation: UserValidationService,
    private readonly usersRepository: UsersRepository,
    private readonly userFactory: UsersFactory,
  ) {}

  async execute(dto: CreateUserDto): Promise<string> {
    await this.userValidation.validateUniqueUser(dto);

    const user: UserDocument = await this.userFactory.create(dto);

    user.confirmEmail();

    return await this.usersRepository.save(user);
  }
}
