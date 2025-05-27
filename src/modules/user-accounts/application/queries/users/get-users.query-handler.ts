import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserViewDto } from '../../../api/view-dto/user.view-dto';
import { UsersQueryRepository } from '../../../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from '../../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';

export class GetUsersQuery {
  constructor(public readonly queryParams: GetUsersQueryParams) {}
}

@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler
  implements IQueryHandler<GetUsersQuery, PaginatedViewDto<UserViewDto>>
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(query: GetUsersQuery): Promise<PaginatedViewDto<UserViewDto>> {
    return this.usersQueryRepository.getAll(query.queryParams);
  }
}
