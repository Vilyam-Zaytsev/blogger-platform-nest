import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { Server } from 'http';
import { AdminCredentials } from '../types';
import { CoreConfig } from '../../src/core/core.config';

export class AppTestManager {
  app: INestApplication;
  connection: Connection;
  coreConfig: CoreConfig;

  async init() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.coreConfig = moduleFixture.get(CoreConfig);

    this.app = moduleFixture.createNestApplication();
    appSetup(this.app, this.coreConfig.isSwaggerEnabled);

    await this.app.init();

    this.connection = moduleFixture.get<Connection>(getConnectionToken());
  }

  async cleanupDb() {
    if (!this.connection.db) {
      throw new Error('Database connection is not initialized');
    }

    const collections = await this.connection.db.collections();
    await Promise.all(
      collections.map((collection) => collection.deleteMany({})),
    );
  }

  async close() {
    await this.app.close();
  }

  getServer() {
    return this.app.getHttpServer() as Server;
  }

  getAdminData(): AdminCredentials {
    const login: string | undefined = this.coreConfig.adminLogin;
    const password: string | undefined = this.coreConfig.adminPassword;

    if (!login || !password) {
      throw new Error(
        'Admin credentials are not configured properly: ' +
          'ADMIN_LOGIN and/or ADMIN_PASSWORD environment variables are missing or empty.',
      );
    }

    return {
      login,
      password,
    };
  }
}
