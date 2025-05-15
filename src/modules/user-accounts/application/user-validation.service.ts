import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class UserValidationService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validateUniqueUser(dto: CreateUserDto): Promise<void> {
    const [byLogin, byEmail] = await Promise.all([
      this.usersRepository.getByLogin(dto.login),
      this.usersRepository.getByEmail(dto.email),
    ]);

    if (byLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same login already exists.',
      });
    }

    if (byEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'User with the same email already exists.',
      });
    }
  }
}
