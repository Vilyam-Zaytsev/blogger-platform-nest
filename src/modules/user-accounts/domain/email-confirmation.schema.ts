import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { add } from 'date-fns';

//TODO: куда лучше вынести enum???
export enum ConfirmationStatus {
  Confirmed = 'Confirmed',
  NotConfirmed = 'Not confirmed',
}

/**
 * EmailConfirmationSchema
 * This class represents the email confirmation metadata for a user.
 * It includes the confirmation code, its expiration date, and current confirmation status.
 */
@Schema({ _id: false })
export class EmailConfirmation {
  /**
   * A unique code sent to the user's email for confirmation purposes.
   * This code is required to complete the email verification process.
   * @example "abc123-def456-ghi789"
   */
  @Prop({ type: String, default: null })
  confirmationCode: string | null;

  /**
   * The expiration date and time of the confirmation code.
   * After this timestamp, the code becomes invalid.
   * @example "2025-05-01T12:00:00.000Z"
   */
  @Prop({ type: Date, default: null })
  expirationDate: Date | null;

  /**
   * The current status of the email confirmation.
   * By default, it is set to "Not confirmed".
   * Can be either "Confirmed" or "Not confirmed".
   * @example 'Not confirmed'
   */
  @Prop({
    type: String,
    default: ConfirmationStatus.NotConfirmed,
  })
  confirmationStatus: ConfirmationStatus;

  /**
   * Factory method for creating a new EmailConfirmation instance.
   *
   * If the email is already confirmed, all related fields (confirmation code and expiration date)
   * will be set to null, and the confirmation status will be set to "Confirmed".
   * Otherwise, a new confirmation code will be generated, an expiration time will be set (1 hour and 1 minute from now),
   * and the status will be set to "NotConfirmed".
   *
   * @param {boolean} isConfirmed - Indicates whether the email should be considered confirmed upon creation.
   * @returns {EmailConfirmation} A new instance of EmailConfirmation configured according to the input flag.
   */
  static createInstance(isConfirmed: boolean): EmailConfirmation {
    const emailConfirmation = new this();

    if (isConfirmed) {
      emailConfirmation.confirmationCode = null;
      emailConfirmation.expirationDate = null;
      emailConfirmation.confirmationStatus = ConfirmationStatus.Confirmed;
    } else {
      emailConfirmation.confirmationCode = randomUUID();
      emailConfirmation.expirationDate = add(new Date(), {
        hours: 1,
        minutes: 1,
      });
      emailConfirmation.confirmationStatus = ConfirmationStatus.NotConfirmed;
    }

    return emailConfirmation;
  }
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
