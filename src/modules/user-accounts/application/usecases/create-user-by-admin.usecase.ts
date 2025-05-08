import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserDocument } from '../../domain/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersFactory } from '../users.factory';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CreateUserByAdminUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userFactory: UsersFactory,
  ) {}

  async execute(dto: CreateUserDto): Promise<string> {
    const { login, email } = dto;

    const doesLoginExist: UserDocument | null =
      await this.usersRepository.getByLogin(login);

    if (doesLoginExist) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same login already exists.',
      });
    }

    const doesEmailExist: UserDocument | null =
      await this.usersRepository.getByLogin(email);

    if (doesEmailExist) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same email already exists.',
      });
    }

    const user: UserDocument = await this.userFactory.create(dto);

    user.confirmByAdmin();

    return await this.usersRepository.save(user);
  }
}
