import { configModule } from './dynamic-config-module';
import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import process from 'node:process';

@Module({
  imports: [
    configModule,
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017',
      {
        dbName: 'blogger-platform-dev',
      },
    ),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
})
export class AppModule {}
