import { UsersQueryRepository } from '../../src/modules/user-accounts/infrastructure/query/users.query-repository';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';

export class UsersTestManager {
  private usersQueryRepository: UsersQueryRepository;

  constructor(usersQueryRepository: UsersQueryRepository) {
    this.usersQueryRepository = usersQueryRepository;
  }
  //TODO: исправить {} as GetUsersQueryParams в getAll
  async getAllUsers(): Promise<PaginatedViewDto<UserViewDto>> {
    return await this.usersQueryRepository.getAll({} as GetUsersQueryParams);
  }
}
