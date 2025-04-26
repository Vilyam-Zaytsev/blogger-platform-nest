import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  PasswordRecovery,
  PasswordRecoverySchema,
} from './password-recovery.schema';
import {
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email-confirmation.schema';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

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
  @Prop({ type: String, required: true })
  login: string;

  /**
   * Email address of the user.
   * Used for registration confirmation and password recovery.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
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
  //TODO: в каком случае необходимо указывать nullable: true?(Уточнить на уроке)
  @Prop({ type: Date, nullable: true })
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
    const { login, email, passwordHash } = dto;

    const user = new this();
    user.login = login;
    user.email = email;
    user.passwordHash = passwordHash;
    user.passwordRecovery = new PasswordRecovery();
    user.emailConfirmation = new EmailConfirmation();

    return user as UserDocument;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.loadClass(User);

export type UserDocument = HydratedDocument<User>;

export type UserModelType = Model<UserDocument> & typeof User;
