import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { MeViewDto } from '../../api/view-dto/user.view-dto';
import { UserDocument } from '../../domain/user.entity';

@Injectable()
export class AuthQueryRepository {
  constructor(private usersRepository: UsersRepository) {}

  async me(id: string): Promise<MeViewDto> {
    const user: UserDocument =
      await this.usersRepository.getByIdOrNotFoundFail(id);

    return MeViewDto.mapToView(user);
  }
}
