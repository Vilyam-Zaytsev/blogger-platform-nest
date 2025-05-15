import { AppTestManager } from '../managers/app.test-manager';
import { UsersTestManager } from '../managers/users.test-manager';
import { AdminCredentials, TestSearchFilter } from '../types';
import { Server } from 'http';
import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestUtils } from '../helpers/test.utils';
import { TestLoggers } from '../helpers/test.loggers';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { Filter } from '../helpers/filter';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { UsersSortBy } from '../../src/modules/user-accounts/api/input-dto/users-sort-by';

describe('UsersController - getUser() (GET: /users (pagination, sort, search in term))', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    usersTestManager = new UsersTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should use default pagination values when none are provided by the client.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const query: GetUsersQueryParams = new GetUsersQueryParams();
    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 10,
      totalCount: 12,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(10);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №1: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });

  it('should use client-provided pagination values to return the correct subset of data(1).', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .query({
        pageNumber: 2,
        pageSize: 3,
        sortBy: UsersSortBy.Login,
        sortDirection: SortDirection.Ascending,
      })
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const query: GetUsersQueryParams = new GetUsersQueryParams();
    query.pageSize = 3;
    query.pageNumber = 2;
    query.sortBy = UsersSortBy.Login;
    query.sortDirection = SortDirection.Ascending;

    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 4,
      page: 2,
      pageSize: 3,
      totalCount: 12,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(3);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №2: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });

  it('should use client-provided pagination values to return the correct subset of data(2).', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .query({
        pageNumber: 6,
        pageSize: 2,
        sortDirection: SortDirection.Ascending,
      })
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const query: GetUsersQueryParams = new GetUsersQueryParams();
    query.pageSize = 2;
    query.pageNumber = 6;
    query.sortDirection = SortDirection.Ascending;

    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 6,
      page: 6,
      pageSize: 2,
      totalCount: 12,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(2);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №3: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });

  it('should use the values provided by the client to search for users by the occurrence of the substring (the  "login" field).', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .query({
        searchLoginTerm: 'r1',
      })
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const searchFilter: TestSearchFilter = {
      login: 'r1',
    };
    const query: GetUsersQueryParams = new GetUsersQueryParams();
    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .filter(searchFilter)
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 3,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(3);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №4: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });

  it('should use the values provided by the client to search for users by the occurrence of the substring (the "email" field).', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .query({
        searchEmailTerm: 'r1',
      })
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const searchFilter: TestSearchFilter = {
      email: 'r1',
    };
    const query: GetUsersQueryParams = new GetUsersQueryParams();
    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .filter(searchFilter)
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 3,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(3);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №5: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });

  it('should use the values provided by the client to search for users by the occurrence of the substring (the "login" and "email" fields).', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(12);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .query({
        searchLoginTerm: 'r1',
        searchEmailTerm: 'r5',
      })
      .expect(200);

    const bodyFromGetRequest: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const searchFilter: TestSearchFilter = {
      login: 'r1',
      email: 'r5',
    };
    const query: GetUsersQueryParams = new GetUsersQueryParams();
    const filteredNewUsers: UserViewDto[] = new Filter(newUsers)
      .filter(searchFilter)
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 4,
      items: filteredNewUsers,
    });
    expect(bodyFromGetRequest.items.length).toEqual(4);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №6: UsersController - getUser() (GET: /users (pagination, sort, search in term))',
    );
  });
});
