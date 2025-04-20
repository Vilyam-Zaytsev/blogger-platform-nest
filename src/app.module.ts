import { Module } from '@nestjs/common';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { UsersController } from './modules/user-accounts/api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    UserAccountsModule,
  ],
  controllers: [UsersController],
})
export class AppModule {}
