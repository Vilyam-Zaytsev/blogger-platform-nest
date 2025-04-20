import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

//TODO: куда лучше вынести enum???
enum ConfirmationStatus {
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
  @Prop({ type: String, required: true, default: null })
  confirmationCode: string | null;

  /**
   * The expiration date and time of the confirmation code.
   * After this timestamp, the code becomes invalid.
   * @example "2025-05-01T12:00:00.000Z"
   */
  @Prop({ type: Date, required: true, default: null })
  expirationDate: Date | null;

  /**
   * The current status of the email confirmation.
   * By default, it is set to "Not confirmed".
   * Can be either "Confirmed" or "Not confirmed".
   * @example 'Not confirmed'
   */
  @Prop({
    type: String,
    required: true,
    default: ConfirmationStatus.NotConfirmed,
  })
  confirmationStatus: ConfirmationStatus;
}

export const EmailConfirmationSchema =
  SchemaFactory.createForClass(EmailConfirmation);
