import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';

@Module({
  imports: [UserAccountsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
