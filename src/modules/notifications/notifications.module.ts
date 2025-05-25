import { SendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/send-confirmation-email-when-user-registered.event-handler';
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { configModule } from '../../dynamic-config.module';
import { EmailTemplates } from './templates/email.templates';
import { NotificationsConfig } from './config/notifications.config';
import { NotificationsConfigModule } from './config/notifications-config.module';
import { ResendConfirmationEmailWhenUserRegisteredEventHandler } from './event-handlers/resend-confirmation-email-when-user-registered.event-handler';
import { SendRecoveryCodeEmailWhenUserPasswordRecoveryEventHandler } from './event-handlers/send-recovery-code-email-when-user-password-recovery.event-handler';

@Module({
  imports: [
    configModule,
    MailerModule.forRootAsync({
      imports: [NotificationsConfigModule],
      inject: [NotificationsConfig],

      useFactory: (notificationsConfig: NotificationsConfig) => {
        const email: string = notificationsConfig.emailApp;
        const password: string = notificationsConfig.emailAppPassword;

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
    SendRecoveryCodeEmailWhenUserPasswordRecoveryEventHandler,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
