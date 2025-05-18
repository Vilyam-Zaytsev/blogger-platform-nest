import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import { configModule } from '../../config/dynamic-config.module';
import { EmailTemplates } from './templates/email.templates';

@Module({
  imports: [
    configModule,
    MailerModule.forRootAsync({
      imports: [configModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const email: string | undefined = configService.get<string>('EMAIL');
        const password: string | undefined =
          configService.get<string>('EMAIL_PASSWORD');

        if (!email || !password) {
          throw new Error(
            'EMAIL and EMAIL_PASSWORD must be defined in environment variables',
          );
        }

        return {
          transport: `smtps://${encodeURIComponent(email)}:${encodeURIComponent(password)}@smtp.gmail.com`,
          defaults: { from: `Blogger Platform <${email}>` },
        };
      },
    }),
  ],
  providers: [
    EmailService,
    EmailTemplates,
    SendConfirmationEmailWhenUserRegisteredEventHandler,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
