import { configModule } from './dynamic-config-module';
import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017', {
      dbName: 'blogger-platform-dev',
    }),
    configModule,
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
})
export class AppModule {}
