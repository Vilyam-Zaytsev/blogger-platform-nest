import request, { Response } from 'supertest';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { TestUtils } from '../helpers/test.utils';

describe('AuthController - login() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    usersTestManager = new UsersTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should be authorized if the user has sent the correct data (loginOrEmail and password)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: user.login,
        password: 'qwerty',
      })
      .expect(200);

    expect(resLogin.body).toEqual({
      accessToken: expect.any(String),
    });

    expect(resLogin.headers['set-cookie']).toBeDefined();
    expect(resLogin.headers['set-cookie'][0]).toMatch(/refreshToken=.*;/);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №1: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not log in if the user has sent invalid data (loginOrEmail: "undefined", password: "undefined")', async () => {
    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({})
      .expect(400);

    expect(resLogin.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: 'password must be a string; Received value: undefined',
        },
        {
          field: 'loginOrEmail',
          message: 'loginOrEmail must be a string; Received value: undefined',
        },
      ],
    });

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №3: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not log in if the user has sent invalid data (loginOrEmail: type number, password: type number)', async () => {
    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: 123,
        password: 123,
      })
      .expect(400);

    expect(resLogin.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: 'password must be a string; Received value: 123',
        },
        {
          field: 'loginOrEmail',
          message: 'loginOrEmail must be a string; Received value: 123',
        },
      ],
    });

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №4: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not log in if the user has sent invalid data (loginOrEmail: empty line, password: empty line)', async () => {
    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: '   ',
        password: '   ',
      })
      .expect(400);

    expect(resLogin.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message:
            'password must be longer than or equal to 6 characters; Received value: ',
        },
        {
          field: 'loginOrEmail',
          message:
            'loginOrEmail must be longer than or equal to 3 characters; Received value: ',
        },
      ],
    });

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №5: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not log in if the user has sent invalid data (loginOrEmail: exceeds max length, password: exceeds max length)', async () => {
    const loginOrEmail: string = TestUtils.generateRandomString(101);
    const password: string = TestUtils.generateRandomString(21);

    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail,
        password,
      })
      .expect(400);

    expect(resLogin.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: `password must be shorter than or equal to 20 characters; Received value: ${password}`,
        },
        {
          field: 'loginOrEmail',
          message: `loginOrEmail must be shorter than or equal to 100 characters; Received value: ${loginOrEmail}`,
        },
      ],
    });

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №6: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not log in if the user has sent incorrect data (loginOrEmail: exceeds the minimum length)', async () => {
    const loginOrEmail: string = TestUtils.generateRandomString(2);
    const password: string = TestUtils.generateRandomString(5);

    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail,
        password,
      })
      .expect(400);

    expect(resLogin.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: `password must be longer than or equal to 6 characters; Received value: ${password}`,
        },
        {
          field: 'loginOrEmail',
          message: `loginOrEmail must be longer than or equal to 3 characters; Received value: ${loginOrEmail}`,
        },
      ],
    });

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №7: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not be authorized if the user has sent incorrect data (loginOrEmail: non-existent login)', async () => {
    const loginOrEmail: string = TestUtils.generateRandomString(10);

    await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail,
        password: 'qwerty',
      })
      .expect(401);

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №8: AuthController - login() (POST: /auth)',
      );
    }
  });

  it('should not be authorized if the user has sent incorrect data (password: invalid password).', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const resLogin: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/login`)
      .send({
        loginOrEmail: user.email,
        password: 'incorrect_password',
      })
      .expect(401);

    expect(resLogin.headers['set-cookie']).toBeUndefined();

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resLogin.body,
        resLogin.statusCode,
        'Test №9: AuthController - login() (POST: /auth)',
      );
    }
  });
});
