import { AppTestManager } from '../managers/app.test-manager';
import { UsersTestManager } from '../managers/users.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestUtils } from '../helpers/test.utils';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { TestLoggers } from '../helpers/test.loggers';
import { ObjectId } from 'mongodb';

describe('UsersController - deleteUser() (DELETE: /users)', () => {
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

  it('should delete user, the admin is authenticated.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(1);
    const userId: string = newUsers[0].id;

    const resDeleteUser: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/users/${userId}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(204);

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resDeleteUser.body,
      resDeleteUser.statusCode,
      'Test №1: UsersController - deleteUser() (DELETE: /users)',
    );
  });

  it('should not delete user, the admin is not authenticated.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(1);
    const userId: string = newUsers[0].id;

    const resDeleteUser: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/users/${userId}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .expect(401);

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items[0]).toEqual<UserViewDto>(newUsers[0]);
    expect(users.items).toHaveLength(1);

    TestLoggers.logE2E(
      resDeleteUser.body,
      resDeleteUser.statusCode,
      'Test №2: UsersController - deleteUser() (DELETE: /users)',
    );
  });

  it('should return a 404 error if the user was not found by the passed ID in the parameters.', async () => {
    const newUsers: UserViewDto[] = await usersTestManager.createUser(1);
    const incorrectUserId: string = new ObjectId().toString();

    const resDeleteUser: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/users/${incorrectUserId}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(404);

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items[0]).toEqual<UserViewDto>(newUsers[0]);
    expect(users.items).toHaveLength(1);

    TestLoggers.logE2E(
      resDeleteUser.body,
      resDeleteUser.statusCode,
      'Test №3: UsersController - deleteUser() (DELETE: /users)',
    );
  });
});
