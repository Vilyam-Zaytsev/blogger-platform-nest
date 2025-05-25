import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplate } from './templates/types';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    const { subject, html } = template;

    await this.mailerService.sendMail({
      to,
      subject,
      html,
    });
  }
}
