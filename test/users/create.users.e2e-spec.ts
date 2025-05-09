import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestUtils } from '../helpers/test.utils';
import { ConfigService } from '@nestjs/config';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UsersTestManager } from '../managers/users.test-manager';
import { UsersQueryRepository } from '../../src/modules/user-accounts/infrastructure/query/users.query-repository';

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
    configService = moduleFixture.get(ConfigService);

    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    const usersQueryRepository = moduleFixture.get(UsersQueryRepository);
    usersTestManager = new UsersTestManager(usersQueryRepository);
  });

  beforeEach(async () => {
    if (!connection.db) {
      throw new Error('Database connection is not initialized');
    }

    const collections = await connection.db.listCollections().toArray();

    for (const collection of collections) {
      await connection.db.collection(collection.name).deleteMany({});
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new user, the admin is authenticated.', async () => {
    const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

    const resCreateUser: Response = await request(app.getHttpServer() as Server)
      .post('/users')
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

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');

    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);

    const users: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAllUsers();

    console.log(users);
  });
});
