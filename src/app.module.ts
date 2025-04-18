import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { UsersController } from './modules/user-accounts/api/users.controller';

@Module({
  imports: [UserAccountsModule],
  controllers: [AppController, UsersController],
  providers: [AppService],
})
class AppModule {}

export { AppModule };
