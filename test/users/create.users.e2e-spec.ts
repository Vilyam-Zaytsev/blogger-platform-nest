import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestUtils } from '../helpers/test.utils';
import { ConfigService } from '@nestjs/config';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UsersTestManager } from '../managers/users.test-manager';
import { appSetup } from '../../src/setup/app.setup';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { DomainExceptionCode } from '../../src/core/exceptions/domain-exception-codes';

describe('UsersController - createUser() (POST: /users)', () => {
  let app: INestApplication;
  let connection: Connection;
  let configService: ConfigService;
  let usersTestManager: UsersTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSetup(app);

    configService = moduleFixture.get(ConfigService);

    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    usersTestManager = new UsersTestManager(app, configService);
  });

  beforeEach(async () => {
    if (!connection.db) {
      throw new Error('Database connection is not initialized');
    }

    const collections = await connection.db.collections();
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new user, the admin is authenticated.', async () => {
    const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

    const resCreateUser: Response = await request(app.getHttpServer() as Server)
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({
        login: dto.login,
        email: dto.email,
        password: dto.password,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          configService.get('ADMIN_LOGIN')!,
          configService.get('ADMIN_PASSWORD')!,
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

    const resCreateUser: Response = await request(app.getHttpServer() as Server)
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
    const resCreateUser: Response = await request(app.getHttpServer() as Server)
      .post(`/${GLOBAL_PREFIX}/users`)
      .send({})
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          configService.get('ADMIN_LOGIN')!,
          configService.get('ADMIN_PASSWORD')!,
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
});
