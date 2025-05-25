import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../email.service';
import { EmailTemplate } from '../templates/types';
import { EmailTemplates } from '../templates/email.templates';
import { UserPasswordRecoveryEvent } from '../../user-accounts/domain/events/user-password-recovery.event';

@EventsHandler(UserPasswordRecoveryEvent)
export class SendRecoveryCodeEmailWhenUserPasswordRecoveryEventHandler
  implements IEventHandler<UserPasswordRecoveryEvent>
{
  constructor(
    private emailService: EmailService,
    private readonly templates: EmailTemplates,
  ) {}

  async handle(event: UserPasswordRecoveryEvent) {
    const { email, recoveryCode } = event;

    const template: EmailTemplate =
      this.templates.passwordRecoveryEmail(recoveryCode);

    try {
      await this.emailService.sendEmail(email, template);
    } catch (e) {
      console.error('send email', e);
    }
  }
}
