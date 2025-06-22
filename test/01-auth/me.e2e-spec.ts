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
import { HttpStatus } from '@nestjs/common';

describe('AuthController - me() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
  let testLoggingEnabled: boolean;
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

    appTestManager.clearThrottlerStorage();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should return information about the user if the user is logged in (sends a valid access token)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      user.login,
    ]);

    const accessToken: string = resultLogin.authTokens.accessToken;

    const resMe: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    expect(resMe.body).toEqual(
      expect.objectContaining({
        email: user.email,
        login: user.login,
        userId: user.id,
      }),
    );

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resMe.body,
        resMe.statusCode,
        'Test №1: AuthController - me() (POST: /auth)',
      );
    }
  });

  it('should return a 401 error if the user is not logged in (sending an invalid access token)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      user.login,
    ]);

    const accessToken: string = resultLogin.authTokens.accessToken;

    await TestUtils.delay(3000);

    const resMe: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resMe.body,
        resMe.statusCode,
        'Test №2: AuthController - me() (POST: /auth)',
      );
    }
  });
});
