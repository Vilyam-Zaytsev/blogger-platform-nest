import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
} from './password-recovery.schema';
import {
  ConfirmationStatus,
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { CreateUserDomainDto } from '../../dto/create-user.domain.dto';
import { HydratedDocument, Model } from 'mongoose';
import { makeDeleted } from '../../../../../core/utils/entity.common-utils';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]*$/,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
};

/**
 * User Entity Schema
 *
 * Represents the schema and structure of a User entity.
 * Includes authentication data, email confirmation, and password recovery information.
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Unique login of the user.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, unique: true, ...loginConstraints })
  login: string;

  /**
   * Email address of the user.
   * Used for registration confirmation and password recovery.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, unique: true, ...emailConstraints })
  email: string;

  /**
   * Password hash for authentication.
   * Stored instead of the plain password for security reasons.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  /**
   * Password recovery details.
   * Contains information required to restore access to the account.
   *
   * @type {PasswordRecovery}
   * @required
   */
  @Prop({ type: PasswordRecoverySchema, required: true })
  passwordRecovery: PasswordRecovery;

  /**
   * Email confirmation data.
   * Includes confirmation status and related metadata.
   *
   * @type {EmailConfirmation}
   * @required
   */
  @Prop({ type: EmailConfirmationSchema, required: true })
  emailConfirmation: EmailConfirmation;

  /**
   * Timestamp indicating when the document was created.
   * Automatically set by Mongoose when the document is first saved.
   *
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp indicating the last time the document was updated.
   * Automatically updated by Mongoose on each modification.
   *
   * @type {Date}
   */
  updatedAt: Date;

  /**
   * Timestamp indicating when the document was soft-deleted.
   * Can be null if the document has not been deleted.
   *
   * @type {Date | null}
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method for creating a new User instance from a DTO.
   * Initializes essential properties including login, email, password hash,
   * as well as nested entities such as passwordRecovery and emailConfirmation.
   *
   * @param {CreateUserDomainDto} dto - Data transfer object containing the user registration data.
   * @returns {UserDocument} A new User document instance ready for persistence.
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const { login, email, passwordHash, confirmationCode, expirationDate } =
      dto;

    const user = new this();

    user.login = login;
    user.email = email;
    user.passwordHash = passwordHash;
    user.passwordRecovery = new PasswordRecovery();
    user.emailConfirmation = EmailConfirmation.createInstance(
      confirmationCode,
      expirationDate,
    );

    return user as UserDocument;
  }

  /**
   * Marks the entity as soft-deleted by setting the `deletedAt` timestamp.
   *
   * If the entity has already been marked as deleted (i.e., `deletedAt` is not null),
   * an error will be thrown to prevent duplicate deletion operations.
   *
   * This method is typically used to implement soft deletion logic,
   * allowing the entity to be excluded from active queries without being permanently removed from the database.
   *
   * @throws {Error} If the entity has already been soft-deleted.
   */
  delete() {
    makeDeleted.call(this);
  }

  /**
   * Marks the user's email as confirmed manually by an administrator.
   *
   * This method clears the existing confirmation code and expiration date,
   * and sets the confirmation status to "Confirmed".
   * Typically used in administrative workflows where email confirmation is bypassed.
   *
   * @returns {void}
   */
  confirmEmail() {
    this.emailConfirmation.confirmationCode = null;
    this.emailConfirmation.expirationDate = null;
    this.emailConfirmation.confirmationStatus = ConfirmationStatus.Confirmed;
  }

  /**
   * Updates the confirmation code and its expiration date for the user's email verification.
   *
   * Typically used when resending the confirmation email or generating a new verification code.
   *
   * @param {string} confirmationCode - The new confirmation code to be sent to the user.
   * @param {Date} expirationDate - The new expiration date and time for the confirmation code.
   */
  refreshConfirmationCode(confirmationCode: string, expirationDate: Date) {
    this.emailConfirmation.confirmationCode = confirmationCode;
    this.emailConfirmation.expirationDate = expirationDate;
  }

  /**
   * Sets the password recovery code and its expiration date for the user.
   *
   * Typically used when initiating a password recovery process (e.g., user requested a password reset).
   * Stores the provided recovery code and expiration date in the user entity.
   *
   * @param {string} recoveryCode - A unique recovery code to be used for resetting the password.
   * @param {Date} expirationDate - The date and time when the recovery code expires.
   */
  recoverPassword(recoveryCode: string, expirationDate: Date) {
    this.passwordRecovery = {
      recoveryCode,
      expirationDate,
    };
  }

  /**
   * Updates the user's password with a new password hash and clears the recovery data.
   *
   * This method is typically used after a successful password recovery process.
   * It replaces the current password hash with a new one and nullifies the recovery code and its expiration date
   * to prevent reuse of the same recovery token.
   *
   * @param {string} newPasswordHash - The new hashed password to set for the user.
   */
  updatePassword(newPasswordHash: string) {
    this.passwordRecovery.recoveryCode = null;
    this.passwordRecovery.expirationDate = null;
    this.passwordHash = newPasswordHash;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
