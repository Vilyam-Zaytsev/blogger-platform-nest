import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { HttpStatus } from '@nestjs/common';
import { UsersTestManager } from '../managers/users.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { parseUserAgent } from '../../src/core/utils/parse-user-agent.util';

describe('SessionsController - deleteSession() (DELETE: /security/devices/{deviceId})', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
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
              signOptions: { expiresIn: '20s' },
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

    usersTestManager = new UsersTestManager(server, adminCredentialsInBase64);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    appTestManager.clearThrottlerStorage();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should delete a specific session by ID if the user is logged in.', async () => {
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(2);

    const shortUserAgents = [
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Firefox/102.0 (X11; Ubuntu; Linux x86_64)',
      'Chrome/114.0 (Linux; Android 13; SM-S901B)',
    ];

    const resLogins: Record<string, Response[]> = {
      resLogins_user1: [],
      resLogins_user2: [],
    };

    // 🔻 Авторизация каждого пользователя на всех устройствах
    for (let i = 0; i < createdUsers.length; i++) {
      for (let j = 0; j < shortUserAgents.length; j++) {
        const res: Response = await request(server)
          .post(`/${GLOBAL_PREFIX}/auth/login`)
          .set('User-Agent', parseUserAgent(shortUserAgents[j]))
          .send({
            loginOrEmail: createdUsers[i].login,
            password: 'qwerty',
          })
          .expect(HttpStatus.OK);

        expect(res.body).toEqual({
          accessToken: expect.any(String),
        });

        resLogins[`resLogins_user${i + 1}`].push(res);

        // 🔸 Задержка для того чтобы отличалось время создания сессии
        await TestUtils.delay(1000);
      }
    }

    // 🔻 Обновление пары токенов первого юзера на всех устройствах
    const refreshToken_user1_session1: string =
      resLogins.resLogins_user1[0].headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

    // 🔸 Извлекаем из БД все сессии первого пользователя до обновления пары токенов, чтобы затем сравнить время
    // создания сессии после обновления
    const resGetSessions_user1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [`refreshToken=${refreshToken_user1_session1}`])
      .expect(HttpStatus.OK);

    for (let i = 0; i < resLogins.resLogins_user1.length; i++) {
      // 🔸 Задержка для того чтобы отличалось время создания сессии
      await TestUtils.delay(1000);

      const refreshToken: string = resLogins.resLogins_user1[i].headers[
        'set-cookie'
      ][0]
        .split(';')[0]
        .split('=')[1];

      const resRefreshToken: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(HttpStatus.OK);

      // 🔸 Извлекаем из БД все сессии первого пользователя после каждого запроса на обновления пары токенов,
      // чтобы сравнить время создания сессии после обновления
      const resGetSessions: Response = await request(server)
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', [
          `refreshToken=${resRefreshToken.headers['set-cookie'][0].split(';')[0].split('=')[1]}`,
        ])
        .expect(HttpStatus.OK);

      // 🔸 Проверяем, что время создания сессии после обновления отличается от времени создания до обновления
      expect(resGetSessions.body[i].lastActiveDate).not.toEqual(
        resGetSessions_user1.body[i].lastActiveDate,
      );

      // 🔸 Проверяем все остальные сессии на то, что время создания сессий совпадают(на них ни как не повлиял запрос
      // на обновления пары токенов определенной сессии)
      for (let j = i + 1; j < resGetSessions_user1.body.length; j++) {
        expect(resGetSessions.body[j].lastActiveDate).toEqual(
          resGetSessions_user1.body[j].lastActiveDate,
        );
      }
    }

    // 🔻 Обновление пары токенов первого юзера на всех устройствах
    const refreshToken_user2_session1: string =
      resLogins.resLogins_user2[0].headers['set-cookie'][0]
        .split(';')[0]
        .split('=')[1];

    // 🔸 Извлекаем из БД все сессии второго пользователя до обновления пары токенов, чтобы затем сравнить время
    // создания сессии после обновления
    const resGetDevices_user2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [`refreshToken=${refreshToken_user2_session1}`])
      .expect(HttpStatus.OK);

    for (let i = 0; i < resLogins.resLogins_user2.length; i++) {
      // 🔸 Задержка для того чтобы отличалось время создания сессии
      await TestUtils.delay(1000);

      const refreshToken: string = resLogins.resLogins_user2[i].headers[
        'set-cookie'
      ][0]
        .split(';')[0]
        .split('=')[1];

      const resRefreshToken: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/refresh-token`)
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(HttpStatus.OK);

      // 🔸 Извлекаем из БД все сессии второго пользователя после каждого запроса на обновления пары токенов,
      // чтобы сравнить время создания сессии после обновления
      const resGetSessions: Response = await request(server)
        .get(`/${GLOBAL_PREFIX}/security/devices`)
        .set('Cookie', [
          `refreshToken=${resRefreshToken.headers['set-cookie'][0].split(';')[0].split('=')[1]}`,
        ])
        .expect(HttpStatus.OK);

      // 🔸 Проверяем, что время создания сессии после обновления отличается от времени создания до обновления
      expect(resGetSessions.body[i].lastActiveDate).not.toEqual(
        resGetDevices_user2.body[i].lastActiveDate,
      );

      // 🔸 Проверяем все остальные сессии на то, что время создания сессий совпадают(на них ни как не повлиял запрос
      // на обновления пары токенов определенной сессии)
      for (let j = i + 1; j < resGetDevices_user2.body.length; j++) {
        expect(resGetSessions.body[j].lastActiveDate).toEqual(
          resGetDevices_user2.body[j].lastActiveDate,
        );
      }
    }
  }, 50000);
});
