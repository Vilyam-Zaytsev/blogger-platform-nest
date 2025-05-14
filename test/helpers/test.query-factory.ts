import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';

export class TestQueryFactory {
  static createUsersQueryParams(
    partial?: Partial<GetUsersQueryParams>,
  ): GetUsersQueryParams {
    const params = new GetUsersQueryParams();

    params.sortBy = partial?.sortBy ?? params.sortBy;
    params.sortDirection = partial?.sortDirection ?? params.sortDirection;
    params.pageNumber = partial?.pageNumber ?? params.pageNumber;
    params.pageSize = partial?.pageSize ?? params.pageSize;
    params.searchEmailTerm = partial?.searchEmailTerm ?? null;
    params.searchLoginTerm = partial?.searchLoginTerm ?? null;

    return params;
  }
}
