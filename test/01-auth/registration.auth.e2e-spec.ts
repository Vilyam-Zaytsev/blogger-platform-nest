import request, { Response } from 'supertest';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { EmailService } from '../../src/modules/notifications/email.service';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { EmailTemplate } from '../../src/modules/notifications/templates/types';
import { TestUtils } from '../helpers/test.utils';

describe('AuthController - registration() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;
  let sendEmailMock: jest.Mock;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    usersTestManager = new UsersTestManager(server, adminCredentials);

    sendEmailMock = jest
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue() as jest.Mock<Promise<void>, [string, EmailTemplate]>;
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should be registered if the user has sent the correct data (login or email address and password).', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: dto.login,
        email: dto.email,
        password: dto.password,
      })
      .expect(204);

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    const [user] = items;

    if (!user) {
      throw new Error(
        'Test №1: AuthController - registration() (POST: /auth): User not found',
      );
    }

    expect(items).toHaveLength(1);

    expect(typeof user.id).toBe('string');
    expect(new Date(user.createdAt).toString()).not.toBe('Invalid Date');
    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №1: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered if a user with such data already exists (login).', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: user.login,
        email: 'newUser@example.com',
        password: 'qwerty',
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          message: 'User with the same login already exists.',
          field: 'login',
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(1);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №3: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered if a user with such data already exists (email).', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: 'newUser',
        email: user.email,
        password: 'qwerty',
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          message: 'User with the same email already exists.',
          field: 'email',
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(1);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №4: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered a user if the data in the request body is incorrect (an empty object is passed).', async () => {
    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({})
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: 'password must be a string; Received value: undefined',
        },
        {
          field: 'email',
          message:
            'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: undefined',
        },
        {
          field: 'login',
          message: 'login must be a string; Received value: undefined',
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(0);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №5: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered a user if the data in the request body is incorrect (login: empty line, email: empty line, password: empty line).', async () => {
    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: '   ',
        email: '   ',
        password: '   ',
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message:
            'password must be longer than or equal to 6 characters; Received value: ',
        },
        {
          field: 'email',
          message:
            'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: ',
        },
        {
          field: 'login',
          message:
            'login must be longer than or equal to 3 characters; Received value: ',
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(0);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №6: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered a user if the data in the request body is incorrect (login: less than the minimum length, email: incorrect, password: less than the minimum length).', async () => {
    const login: string = TestUtils.generateRandomString(2);
    const email: string = TestUtils.generateRandomString(10);
    const password: string = TestUtils.generateRandomString(5);

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login,
        email,
        password,
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: `password must be longer than or equal to 6 characters; Received value: ${password}`,
        },
        {
          field: 'email',
          message: `email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: ${email}`,
        },
        {
          field: 'login',
          message: `login must be longer than or equal to 3 characters; Received value: ${login}`,
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(0);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №7: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered a user if the data in the request body is incorrect (login: exceeds max length,  email: incorrect, password: exceeds max length).', async () => {
    const login: string = TestUtils.generateRandomString(11);
    const email: string = TestUtils.generateRandomString(10);
    const password: string = TestUtils.generateRandomString(21);

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login,
        email,
        password,
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: `password must be shorter than or equal to 20 characters; Received value: ${password}`,
        },
        {
          field: 'email',
          message: `email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: ${email}`,
        },
        {
          field: 'login',
          message: `login must be shorter than or equal to 10 characters; Received value: ${login}`,
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(0);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №8: AuthController - registration() (POST: /auth)',
    );
  });

  it('should not be registered a user if the data in the request body is incorrect (login: type number,  email: type number, password: type number).', async () => {
    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: 123,
        email: 123,
        password: 123,
      })
      .expect(400);

    expect(resRegistration.body).toEqual({
      errorsMessages: [
        {
          field: 'password',
          message: 'password must be a string; Received value: 123',
        },
        {
          field: 'email',
          message:
            'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: 123',
        },
        {
          field: 'login',
          message: 'login must be a string; Received value: 123',
        },
      ],
    });

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(0);

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №9: AuthController - registration() (POST: /auth)',
    );
  });
});
