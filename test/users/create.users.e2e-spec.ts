import request, { Response } from 'supertest';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestUtils } from '../helpers/test.utils';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { DomainExceptionCode } from '../../src/core/exceptions/domain-exception-codes';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';

describe('UsersController - createUser() (POST: /users)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    usersTestManager = new UsersTestManager(
      appTestManager.app,
      appTestManager.configService,
    );

    adminCredentials = appTestManager.getAdminData();
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should create a new user, the admin is authenticated.', async () => {
    const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login: dto.login,
        email: dto.email,
        password: dto.password,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(201);

    const user: UserViewDto = resCreateUser.body as UserViewDto;

    expect(typeof user.id).toBe('string');
    expect(new Date(user.createdAt).toString()).not.toBe('Invalid Date');
    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(1);
    expect(users.items[0]).toEqual(user);

    TestLoggers.logE2E<UserViewDto>(
      user,
      resCreateUser.statusCode,
      'Test №1: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the admin is not authenticated.', async () => {
    const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login: dto.login,
        email: dto.email,
        password: dto.password,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .expect(401);

    expect(resCreateUser.body).toEqual({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      timestamp: expect.any(String),
      path: '/api/users',
      message: 'unauthorised',
      code: DomainExceptionCode.Unauthorized,
      extensions: [],
    });

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №2: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the data in the request body is incorrect (an empty object is passed).', async () => {
    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({})
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateUser.body).toEqual({
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

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №3: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the data in the request body is incorrect (login: empty line, email: empty line, password: empty line).', async () => {
    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login: '   ',
        email: '   ',
        password: '   ',
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateUser.body).toEqual({
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

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №4: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the data in the request body is incorrect (login: less than the minimum length, email: incorrect, password: less than the minimum length', async () => {
    const login: string = TestUtils.generateRandomString(2);
    const email: string = TestUtils.generateRandomString(10);
    const password: string = TestUtils.generateRandomString(5);

    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login,
        email,
        password,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateUser.body).toEqual({
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

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №5: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the data in the request body is incorrect (login: exceeds max length,  email: incorrect, password: exceeds max length).', async () => {
    const login: string = TestUtils.generateRandomString(2);
    const email: string = TestUtils.generateRandomString(10);
    const password: string = TestUtils.generateRandomString(5);

    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login,
        email,
        password,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateUser.body).toEqual({
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

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №6: UsersController - createUser() (POST: /users)',
    );
  });

  it('should not create a user if the data in the request body is incorrect (login: type number,  email: type number, password: type number).', async () => {
    const resCreateUser: Response = await request(appTestManager.getServer())
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login: 123,
        email: 123,
        password: 123,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateUser.body).toEqual({
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

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(users.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateUser.body,
      resCreateUser.statusCode,
      'Test №7: UsersController - createUser() (POST: /users)',
    );
  });
});
