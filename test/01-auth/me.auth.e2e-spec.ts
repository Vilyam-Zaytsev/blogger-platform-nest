import request, { Response } from 'supertest';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials, TestResultLogin } from '../types';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { TestUtils } from '../helpers/test.utils';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';

describe('AuthController - me() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.accessTokenSecret,
              signOptions: { expiresIn: '2s' },
            });
          },
          inject: [UserAccountsConfig],
        }),
    );

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

  it('should return information about the user if the user is logged in (sends a valid access token)', async () => {
    const users: UserViewDto[] = await usersTestManager.createUser(1);

    const [resultLogin]: TestResultLogin[] = await usersTestManager.login(
      users.map((u) => u.login),
    );

    const accessToken: string = resultLogin.authTokens.accessToken;

    const resMe: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(resMe.body).toEqual(
      expect.objectContaining({
        email: users[0].email,
        login: users[0].login,
        userId: users[0].id,
      }),
    );

    TestLoggers.logE2E(
      resMe.body,
      resMe.statusCode,
      'Test №1: AuthController - me() (POST: /auth)',
    );
  });

  it('should return a 401 error if the user is logged in (sending an invalid access token)', async () => {
    const users: UserViewDto[] = await usersTestManager.createUser(1);

    const [resultLogin]: TestResultLogin[] = await usersTestManager.login(
      users.map((u) => u.login),
    );

    const accessToken: string = resultLogin.authTokens.accessToken;

    await TestUtils.delay(3000);

    const resMe: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    TestLoggers.logE2E(
      resMe.body,
      resMe.statusCode,
      'Test №2: AuthController - me() (POST: /auth)',
    );
  });
});
