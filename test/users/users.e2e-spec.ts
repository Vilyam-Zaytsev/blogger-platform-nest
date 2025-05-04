import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getConnectionToken } from '@nestjs/mongoose';
// import * as request from 'supertest';
import request from 'supertest';
import { Response } from 'supertest';
import { Server } from 'http';

describe('UsersController - createUser() (POST: /users)', () => {
  let app: INestApplication;
  let connection: Connection;
  let httpServer: Server;
  let req: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    httpServer = app.getHttpServer() as Server;
    req = request(httpServer);
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
    const res: Response = await req
      .post('/users')
      .send({
        login: 'test_user',
        email: 'test_user@example.com',
        passwordHash: 'qwerty',
      })
      .expect(201);
  });
});
