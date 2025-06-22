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

    appTestManager.clearThrottlerStorage();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should delete a specific session by ID if the user is logged in.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const resultLogins: TestResultLogin[] = [];

    // Список заголовков `User-Agent`, имитирующих разные устройства
    const shortUserAgents = [
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Firefox/102.0 (X11; Ubuntu; Linux x86_64)',
      'Chrome/114.0 (Linux; Android 13; SM-S901B)',
    ];

    /**
     * Эмулируем 4 логина с разных устройств (разных `User-Agent`),
     * каждый успешный логин возвращает `accessToken` и `refreshToken`,
     * которые сохраняются в `resultLogins` для дальнейшего использования.
     */
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

    /**
     * Получает список активных сессий пользователя.
     * Запрос выполняется с использованием `refreshToken` из первого логина.
     *
     * Ожидается:
     * - Сервер вернёт массив из 4 сессий
     */
    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    // Сохраняем ID первой сессии (устройства), которую позже удалим
    const deviceId_1: string = bodyFromGetResponse[0].deviceId;

    /**
     * Отправляем запрос на удаление указанной сессии (по deviceId)
     * с использованием refreshToken, привязанного к этой сессии.
     * Ожидаем успешное удаление (204 No Content).
     */
    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_1}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.NO_CONTENT);

    /**
     * Повторно обращаемся к списку сессий с тем же удалённым refreshToken
     * — ожидаем 401 Unauthorized, так как сессия была удалена.
     */
    await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.UNAUTHORIZED);

    /**
     * Обращаемся к списку сессий с другим валидным refreshToken —
     * проверяем, что остались 3 активные сессии (одна удалена).
     */
    const resGetSessions_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[1].authTokens.refreshToken}`,
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

    // Список заголовков `User-Agent`, имитирующих разные устройства
    const shortUserAgents = [
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Firefox/102.0 (X11; Ubuntu; Linux x86_64)',
      'Chrome/114.0 (Linux; Android 13; SM-S901B)',
    ];

    /**
     * Эмулируем 4 логина с разных устройств (разных `User-Agent`),
     * каждый успешный логин возвращает `accessToken` и `refreshToken`,
     * которые сохраняются в `resultLogins` для дальнейшего использования.
     */
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

    /**
     * Получает список активных сессий пользователя.
     * Запрос выполняется с использованием `refreshToken` из первого логина.
     *
     * Ожидается:
     * - Сервер вернёт массив из 4 сессий
     */
    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    // Сохраняем ID первой сессии (устройства), которую позже удалим
    const deviceId_1: string = bodyFromGetResponse[0].deviceId;

    /**
     * Пытается удалить сессию без передачи `refreshToken`.
     *
     * Ожидается:
     * - Сервер вернёт 401 (Unauthorized), т.к. пользователь не аутентифицирован
     */
    await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_1}`)
      .expect(HttpStatus.UNAUTHORIZED);

    /**
     * Ждёт истечения времени жизни refreshToken (3 секунды),
     * чтобы токен стал невалидным
     */
    await TestUtils.delay(3000);

    /**
     * Повторно пытается удалить ту же сессию, но с использованием просроченного `refreshToken`.
     *
     * Ожидается:
     * - Сервер снова вернёт 401 (Unauthorized), так как токен недействителен
     */
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

    // Список заголовков `User-Agent`, имитирующих разные устройства
    const shortUserAgents = [
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    ];

    /**
     * Эмулирует вход двух различных пользователей (User#1 и User#2)
     * с разных устройств, используя различные `User-Agent` заголовки.
     *
     * Ожидается:
     * - Сервер должен вернуть статус 200 (OK)
     * - В теле ответа должен быть `accessToken`
     * - В ответе должен быть установлен `refreshToken` в cookie
     */
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

    /**
     * Получает список активных сессий для User#1
     */
    const resGetSessions_user1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponseUser1: SessionViewDto[] =
      resGetSessions_user1.body as SessionViewDto[];

    /**
     * Получает список активных сессий для User#2
     */
    const resGetSessions_user2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[1].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponseUser2: SessionViewDto[] =
      resGetSessions_user2.body as SessionViewDto[];

    // Получает идентификаторы устройств для каждого пользователя
    const deviceId_user1: string = bodyFromGetResponseUser1[0].deviceId;
    const deviceId_user2: string = bodyFromGetResponseUser2[0].deviceId;

    /**
     * Пытается удалить сессию User#2, используя токен User#1
     *
     * Ожидается:
     * - Сервер должен вернуть статус 403 (Forbidden), т.к. пользователь не является владельцем устройства
     */
    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${deviceId_user2}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.FORBIDDEN);

    /**
     * Пытается удалить сессию User#1, используя токен User#2
     *
     * Ожидается:
     * - Сервер также должен вернуть статус 403 (Forbidden)
     */
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

    // Список заголовков `User-Agent`, имитирующих разные устройства
    const shortUserAgents = [
      'Chrome/114.0 (Windows NT 10.0; Win64; x64)',
      'Safari/604.1 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      'Firefox/102.0 (X11; Ubuntu; Linux x86_64)',
      'Chrome/114.0 (Linux; Android 13; SM-S901B)',
    ];

    /**
     * Эмулирует 4 успешные попытки входа пользователя с различных устройств
     * путём установки разных значений заголовка `User-Agent`.
     *
     * Для каждого устройства выполняется POST-запрос на эндпоинт `/auth/login`
     * с корректными данными пользователя.
     *
     * Ожидается:
     * - Сервер должен вернуть статус 200 (OK)
     * - В теле ответа должен присутствовать `accessToken`
     * - В ответе должен быть установлен `refreshToken` в cookie
     */
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

    /**
     * Получает список активных сессий для текущего пользователя
     */
    const resGetSessions_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/security/devices`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: SessionViewDto[] =
      resGetSessions_1.body as SessionViewDto[];

    expect(bodyFromGetResponse.length).toEqual(4);

    /**
     * Генерирует случайный ObjectId, который не соответствует ни одной существующей сессии
     */
    const incorrectId: string = new ObjectId().toString();

    /**
     * Пытается удалить сессию по несуществующему `deviceId`
     *
     * Ожидается:
     * - Сервер должен вернуть статус 404 (Not Found)
     */
    const resDeleteSession: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/security/devices/${incorrectId}`)
      .set('Cookie', [
        `refreshToken=${resultLogins[0].authTokens.refreshToken}`,
      ])
      .expect(HttpStatus.NOT_FOUND);

    /**
     * Повторно запрашивает список активных сессий
     *
     * Ожидается:
     * - Список не должен измениться, всё ещё должно быть 4 сессии
     */
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
