import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './modules/testing/testing.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://Vilyam:D%21OBxcE9%26%3Cu4SK%5D3myze@cluster0.ur8pv.mongodb.net',
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
