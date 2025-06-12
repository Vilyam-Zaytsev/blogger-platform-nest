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
import { HttpStatus } from '@nestjs/common';

describe('UsersController - getUser() (GET: /users)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminCredentials();
    adminCredentialsInBase64 = TestUtils.encodingAdminDataInBase64(
      adminCredentials.login,
      adminCredentials.password,
    );
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    usersTestManager = new UsersTestManager(server, adminCredentialsInBase64);
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
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.OK);

    expect(resGetUsers.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetUsers.body,
        resGetUsers.statusCode,
        'Test №1: UsersController - getUser() (GET: /users)',
      );
    }
  });

  it('should return a 401 error if the admin is not authenticated', async () => {
    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetUsers.body,
        resGetUsers.statusCode,
        'Test №2: UsersController - getUser() (GET: /users)',
      );
    }
  });

  it('should return an array with a single user, the admin is authenticated.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    expect(bodyFromGetResponse.items[0]).toEqual(createdUser);
    expect(bodyFromGetResponse.items.length).toEqual(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetUsers.body,
        resGetUsers.statusCode,
        'Test №3: UsersController - getUser() (GET: /users)',
      );
    }
  });

  it('should return an array with a three users, the admin is authenticated.', async () => {
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(3);

    const resGetUsers: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<UserViewDto> =
      resGetUsers.body as PaginatedViewDto<UserViewDto>;

    const query: GetUsersQueryParams = new GetUsersQueryParams();
    const filteredCreatedUsers: UserViewDto[] = new Filter<UserViewDto>(
      createdUsers,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetResponse.items).toEqual(filteredCreatedUsers);
    expect(bodyFromGetResponse.items.length).toEqual(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetUsers.body,
        resGetUsers.statusCode,
        'Test №4: UsersController - getUser() (GET: /users)',
      );
    }
  });
});
