import { DynamicModule, INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { getConnectionToken } from '@nestjs/mongoose';
import { Server } from 'http';
import { AdminCredentials, MemoryThrottlerStorageLike } from '../types';
import { CoreConfig } from '../../src/core/core.config';
import { initAppModule } from '../../src/init-app-module';
import { ThrottlerStorage } from '@nestjs/throttler';

export class AppTestManager {
  app: INestApplication;
  connection: Connection;
  coreConfig: CoreConfig;

  async init(
    addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
  ) {
    const DynamicAppModule: DynamicModule = await initAppModule();

    const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule(
      {
        imports: [DynamicAppModule],
      },
    );

    if (addSettingsToModuleBuilder) {
      addSettingsToModuleBuilder(testingModuleBuilder);
    }

    const testingAppModule = await testingModuleBuilder.compile();

    this.app = testingAppModule.createNestApplication();

    this.coreConfig = this.app.get<CoreConfig>(CoreConfig);

    appSetup(this.app, this.coreConfig.isSwaggerEnabled);

    await this.app.init();

    this.connection = this.app.get<Connection>(getConnectionToken());
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

  clearThrottlerStorage() {
    const throttlerStorage: ThrottlerStorage =
      this.app.get<ThrottlerStorage>(ThrottlerStorage);

    const memoryStorage = throttlerStorage as MemoryThrottlerStorageLike;

    if (memoryStorage.storage instanceof Map) {
      memoryStorage.storage.clear();
    }
  }

  async close() {
    await this.app.close();
  }

  getServer() {
    return this.app.getHttpServer() as Server;
  }

  getAdminCredentials(): AdminCredentials {
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
