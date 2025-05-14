import { AppTestManager } from '../managers/app.test-manager';
import { UsersTestManager } from '../managers/users.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestUtils } from '../helpers/test.utils';
import { TestLoggers } from '../helpers/test.loggers';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { Filter } from '../helpers/filter';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';

describe('UsersController - getUser() (GET: /users)', () => {
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

  it('should return an empty array, the admin is authenticated.', async () => {
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

    expect({
      pageCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №1: UsersController - getUser() (GET: /users)',
    );
  });

  it('should return a 401 error if the admin is not authenticated', async () => {
    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect login',
          'incorrect password',
        ),
      )
      .expect(401);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №2: UsersController - getUser() (GET: /users)',
    );
  });

  it('should return an array with a single user, the admin is authenticated.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(1);

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

    expect(bodyFromGetRequest.items[0]).toEqual(newUsers[0]);
    expect(bodyFromGetRequest.items.length).toEqual(1);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №3: UsersController - getUser() (GET: /users)',
    );
  });

  it('should return an array with a three users, the admin is authenticated.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(3);

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
      .getResult();

    expect(bodyFromGetRequest.items).toEqual(filteredNewUsers);
    expect(bodyFromGetRequest.items.length).toEqual(3);

    TestLoggers.logE2E(
      resGetUsers.body,
      resGetUsers.statusCode,
      'Test №4: UsersController - getUser() (GET: /users)',
    );
  });
});
