import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailService } from '../email.service';
import { EmailTemplate } from '../templates/types';
import { EmailTemplates } from '../templates/email.templates';
import { UserResendRegisteredEvent } from '../../user-accounts/domain/events/user-resend-registered.event';

@EventsHandler(UserResendRegisteredEvent)
export class ResendConfirmationEmailWhenUserRegisteredEventHandler
  implements IEventHandler<UserResendRegisteredEvent>
{
  constructor(
    private readonly emailService: EmailService,
    private readonly templates: EmailTemplates,
  ) {}

  async handle(event: UserResendRegisteredEvent) {
    const { email, confirmationCode } = event;

    const template: EmailTemplate =
      this.templates.registrationEmail(confirmationCode);
    try {
      await this.emailService.sendEmail(email, template);
    } catch (e) {
      console.error('send email', e);
    }
  }
}
