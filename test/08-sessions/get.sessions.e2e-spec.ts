import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials, TestResultLogin } from '../types';
import { Server } from 'http';
import { HttpStatus } from '@nestjs/common';
import { UsersTestManager } from '../managers/users.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { SessionViewDto } from '../../src/modules/user-accounts/api/view-dto/session.view-dto';
import { parseUserAgent } from '../../src/core/utils/parse-user-agent.util';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';

describe('SessionsController - getAll() (GET: /security/devices)', () => {
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

  it('should return an array with one session if the user is logged in on only one device.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);

    const resGetSessions: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [`refreshToken=${resultLogin.authTokens.refreshToken}`])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(1);

    expect(bodyFromGetResponse).toEqual([
      {
        ip: expect.any(String),
        title: expect.any(String),
        lastActiveDate: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
        ),
        deviceId: expect.any(String),
      },
    ]);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetSessions.statusCode,
        'Test №1: SessionsController - getAll() (GET: /security/devices)',
      );
    }
  });

  it('should return an array with four sessions if the user is logged in on four different devices.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const resultLogins: TestResultLogin[] = [];
    const shortUserAgents = [
      // Chrome на Windows
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',

      // Safari на iPhone
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',

      // Firefox на Linux
      'Firefox/102.0 (X11; Ubuntu; Linux x86_64)',

      // Chrome на Android
      'Chrome/114.0 (Linux; Android 13; SM-S901B)',
    ];

    for (let i = 0; i < 4; i++) {
      const res: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .set('User-Agent', shortUserAgents[i])
        .send({
          loginOrEmail: createdUser.login,
          password: 'qwerty',
        })
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
        }),
      );

      const body = res.body as { accessToken: string };

      const authTokens = {
        accessToken: body.accessToken,
        refreshToken: res.headers['set-cookie'][0].split(';')[0].split('=')[1],
      };

      const result = {
        loginOrEmail: createdUser.login,
        authTokens,
      };

      resultLogins.push(result);
    }

    const resGetSessions: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    for (let i = 0; i < bodyFromGetResponse.length; i++) {
      expect(bodyFromGetResponse[i]).toEqual({
        ip: expect.any(String),
        title: parseUserAgent(shortUserAgents[i]),
        lastActiveDate: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
        ),
        deviceId: expect.any(String),
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetSessions.statusCode,
        'Test №2: SessionsController - getAll() (GET: /security/devices)',
      );
    }
  });

  it('should not return an array with sessions if the user is not logged.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);

    await TestUtils.delay(3000);

    const resGetSessions: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [`refreshToken=${resultLogin.authTokens.refreshToken}`])
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetSessions.body,
        resGetSessions.statusCode,
        'Test №3: SessionsController - getAll() (GET: /security/devices)',
      );
    }
  });
});
