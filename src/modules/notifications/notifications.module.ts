import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { configModule } from '../../dynamic-config.module';
import { EmailTemplates } from './templates/email.templates';
import { NotificationsConfig } from './config/notifications.config';
import { NotificationsConfigModule } from './config/notifications-config.module';
import { ResendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/resend-confirmation-email-when-user-registered.event-handler';

@Module({
  imports: [
    configModule,
    MailerModule.forRootAsync({
      imports: [NotificationsConfigModule],
      inject: [NotificationsConfig],

      useFactory: (notificationsConfig: NotificationsConfig) => {
        const email: string | undefined = notificationsConfig.emailApp;
        const password: string | undefined =
          notificationsConfig.emailAppPassword;

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
    NotificationsConfig,
    SendConfirmationEmailWhenUserRegisteredEventHandler,
    ResendConfirmationEmailWhenUserRegisteredEventHandler,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
