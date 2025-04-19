import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { UsersController } from './modules/user-accounts/api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://Vilyam:D%21OBxcE9%26%3Cu4SK%5D3myze@cluster0.ur8pv.mongodb.net/blogger-platform-dev?retryWrites=true&w=majority&appName=Cluster0',
    ),
    UserAccountsModule,
  ],
  controllers: [UsersController],
})
export class AppModule {}
