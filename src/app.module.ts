import { configModule } from './dynamic-config-module';
import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import {
  MongooseModule,
  type MongooseModuleAsyncOptions,
} from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    configModule,
    MongooseModule.forRootAsync({
      imports: [configModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get('MONGO_URL') as string,
          dbName: configService.get('DB_NAME') as string,
        };
      },
    } as MongooseModuleAsyncOptions),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
})
export class AppModule {}
