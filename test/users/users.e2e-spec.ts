import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';

describe('UsersController - createUser() (POST: /users)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());
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

  it('should create a new user', async () => {
    const resCreateUser: Response = await request(app.getHttpServer() as Server)
      .post('/users')
      .send({
        login: 'test_user',
        email: 'test_user@example.com',
        password: 'qwerty',
      })
      .expect(201);

    const user: UserViewDto = resCreateUser.body as UserViewDto;

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');

    expect(user.login).toBe('test_user');
    expect(user.email).toBe('test_user@example.com');
  });
});
