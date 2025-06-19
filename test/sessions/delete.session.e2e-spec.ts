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
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

describe('SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})', () => {
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
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should delete a specific session by ID if the user is logged in.', async () => {
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

    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    const deviceId_1: string = bodyFromGetResponse[0].deviceId;

    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_1}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.NO_CONTENT);

    const resGetSessions_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse_2: SessionViewDto[] =
      resGetSessions_2.body as SessionViewDto[];

    expect(bodyFromGetResponse_2.length).toEqual(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteSession.body,
        resDeleteSession.statusCode,
        'Test №1: SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})',
      );
    }
  });

  it('should not delete session of if the user is not logged in.', async () => {
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

    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    const deviceId_1: string = bodyFromGetResponse[0].deviceId;

    await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_1}`)
      .expect(HttpStatus.UNAUTHORIZED);

    await TestUtils.delay(3000);

    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_1}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.UNAUTHORIZED);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteSession.body,
        resDeleteSession.statusCode,
        'Test №2: SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})',
      );
    }
  });

  it('should not delete a specific session of a specific user if the user is not the owner of this device.', async () => {
    const [createdUser_1, createdUser_2]: UserViewDto[] =
      await usersTestManager.createUser(2);
    const resultLogins: TestResultLogin[] = [];
    const shortUserAgents = [
      // Chrome на Windows
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',

      // Safari на iPhone
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    ];

    for (let i = 0; i < 2; i++) {
      const login: string =
        (i + 1) % 2 === 0 ? createdUser_2.login : createdUser_1.login;

      const res: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .set('User-Agent', shortUserAgents[i])
        .send({
          loginOrEmail: login,
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
        loginOrEmail: login,
        authTokens,
      };

      resultLogins.push(result);
    }

    const resGetSessions_user1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponseUser1: SessionViewDto[] =
      resGetSessions_user1.body as SessionViewDto[];

    const resGetSessions_user2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[1].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponseUser2: SessionViewDto[] =
      resGetSessions_user2.body as SessionViewDto[];

    const deviceId_user1: string = bodyFromGetResponseUser1[0].deviceId;
    const deviceId_user2: string = bodyFromGetResponseUser2[0].deviceId;

    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_user2}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.FORBIDDEN);

    await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_user1}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[1].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.FORBIDDEN);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteSession.body,
        resDeleteSession.statusCode,
        'Test №3: SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})',
      );
    }
  });

  it('should not delete a specific session of a specific user if no such session exists.', async () => {
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

    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    const incorrectId: string = new ObjectId().toString();

    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${incorrectId}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.NOT_FOUND);

    const resGetSessions_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse_2: SessionViewDto[] =
      resGetSessions_2.body as SessionViewDto[];

    expect(bodyFromGetResponse_2.length).toEqual(4);
    expect(bodyFromGetResponse_2).toEqual(bodyFromGetResponse);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteSession.body,
        resDeleteSession.statusCode,
        'Test №4: SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})',
      );
    }
  });
});
