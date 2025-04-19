import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

/**
 * PasswordRecoverySchema
 * This class represents the schema of the 'passwordRecovery' field for the User entity.
 */
@Schema({ _id: false })
export class PasswordRecovery {
  /**
   * Unique code for password recovery.
   * Used to verify the password reset request.
   * @example "f8c2e4d9-bec7-4a5d-9eae-1e42dc13d4a0"
   */
  @Prop({ type: String, required: true, default: null })
  recoveryCode: string | null;

  /**
   * Expiration date and time of the recovery code.
   * After this time, the code is no longer valid.
   * @example "2025-04-20T12:00:00.000Z"
   */
  @Prop({ type: Date, required: true, default: null })
  expirationDate: Date | null;
}

export const PasswordRecoverySchema =
  SchemaFactory.createForClass(PasswordRecovery);
