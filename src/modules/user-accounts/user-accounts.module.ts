import { Module } from '@nestjs/common';
import { UsersController } from './api/users-controller';
import { UsersService } from './application/users-service';

@Module({
  controllers: [UsersController],
  providers: [UsersService]
})
export class UserAccountsModule {}
