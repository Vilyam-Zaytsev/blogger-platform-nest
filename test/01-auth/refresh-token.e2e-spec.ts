import request, { Response } from 'supertest';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { TestUtils } from '../helpers/test.utils';
import { HttpStatus } from '@nestjs/common';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';

describe('AuthController - refreshToken() (POST: /auth/refresh-token)', () => {
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
        .overrideProvider(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.refreshTokenSecret,
              signOptions: { expiresIn: '3s' },
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

  it('should return a new pair of Access and Refresh tokens if the Refresh token sent by the user is still valid.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: createdUser.login,
        password: 'qwerty',
      })
      .expect(HttpStatus.OK);

    const cookiesLogin: string = resLogin.headers['set-cookie'];

    await TestUtils.delay(1000);

    const resRefreshToken: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.OK);

    const cookiesRefreshToken: string = resRefreshToken.headers['set-cookie'];

    expect(resLogin.body).not.toEqual(resRefreshToken.body);
    expect(cookiesLogin).not.toEqual(cookiesRefreshToken);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRefreshToken.body,
        resRefreshToken.statusCode,
        'Test №1: refreshToken() (POST: /auth/refresh-token)',
      );
    }
  });

  it('should not return a new pair of access and upgrade tokens if the Refresh token sent by the user is expired.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: createdUser.login,
        password: 'qwerty',
      })
      .expect(HttpStatus.OK);

    const cookiesLogin: string = resLogin.headers['set-cookie'];

    await TestUtils.delay(3000);

    const resRefreshToken: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRefreshToken.body,
        resRefreshToken.statusCode,
        'Test №2: refreshToken() (POST: /auth/refresh-token)',
      );
    }
  });

  it('111', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: createdUser.login,
        password: 'qwerty',
      })
      .expect(HttpStatus.OK);

    const cookiesLogin: string = resLogin.headers['set-cookie'];

    await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/logout`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.NO_CONTENT);

    const resRefreshToken: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRefreshToken.body,
        resRefreshToken.statusCode,
        'Test №2: refreshToken() (POST: /auth/refresh-token)',
      );
    }
  });

  it('222', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: createdUser.login,
        password: 'qwerty',
      })
      .expect(HttpStatus.OK);

    const cookiesLogin: string = resLogin.headers['set-cookie'];

    await TestUtils.delay(1000);

    const resRefreshToken: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.OK);

    await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/logout`)
      .set('Cookie', [...cookiesLogin])
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRefreshToken.body,
        resRefreshToken.statusCode,
        'Test №2: refreshToken() (POST: /auth/refresh-token)',
      );
    }
  });
});
