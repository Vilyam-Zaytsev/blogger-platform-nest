import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
   * Factory method for creating a new EmailConfirmation instance with a custom confirmation code and expiration date.
   *
   * This method is useful when the confirmation code and expiration date
   * need to be explicitly provided (e.g., for manual account setup or testing purposes).
   * The confirmation status is set to "NotConfirmed" by default.
   *
   * @param {string} confirmationCode - The code to be used for confirming the user's email.
   * @param {Date} expirationDate - The date and time when the confirmation code expires.
   * @returns {EmailConfirmation} A new instance of EmailConfirmation with the specified values.
   */
  //TODO: написать unit тест
  static createInstance(
    confirmationCode: string,
    expirationDate: Date,
  ): EmailConfirmation {
    const emailConfirmation = new this();

    emailConfirmation.confirmationCode = confirmationCode;
    emailConfirmation.expirationDate = expirationDate;
    emailConfirmation.confirmationStatus = ConfirmationStatus.NotConfirmed;

    return emailConfirmation;
  }
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
