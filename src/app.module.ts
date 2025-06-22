import { configModule } from './dynamic-config.module';
import { DynamicModule, Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { APP_FILTER } from '@nestjs/core';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { ValidationExceptionFilter } from './core/exceptions/filters/validation-exception.filter';
import { CoreModule } from './core/core.module';
import { CoreConfig } from './core/core.config';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    configModule,
    CoreModule,
    UserAccountsModule,
    BloggersPlatformModule,
    NotificationsModule,
    TestingModule,
    MongooseModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => {
        return {
          uri: coreConfig.mongoURL,
          dbName: coreConfig.dbName,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => [
        {
          ttl: coreConfig.throttleTtl,
          limit: coreConfig.throttleLimit,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
    };
  }
}
