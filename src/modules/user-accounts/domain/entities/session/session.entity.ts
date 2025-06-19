import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateSessionDomainDto } from '../../dto/create-session.domain.dto';
import { HydratedDocument, Model } from 'mongoose';
import { makeDeleted } from '../../../../../core/utils/entity.common-utils';

/**
 * Represents a user session for authentication and device management.
 * Stores information about the device, IP, and token timestamps.
 * Supports soft deletion and automatic timestamps.
 */
@Schema({ timestamps: true })
export class Session {
  /**
   * The ID of the user who owns this session.
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * Unique identifier of the device associated with this session.
   */
  @Prop({ type: String, required: true })
  deviceId: string;

  /**
   * Human-readable name or description of the device.
   */
  @Prop({ type: String, required: true })
  deviceName: string;

  /**
   * IP address from which the session was initiated.
   */
  @Prop({ type: String, required: true })
  ip: string;

  /**
   * Issued At timestamp (iat) - when the session/token was created.
   */
  @Prop({ type: Date, required: true })
  iat: Date;

  /**
   * Expiration timestamp (exp) - when the session/token will expire.
   */
  @Prop({ type: Date, required: true })
  exp: Date;

  /**
   * Timestamp when this session document was created.
   * Automatically managed by Mongoose.
   */
  createdAt: Date;

  /**
   * Timestamp when this session document was last updated.
   * Automatically managed by Mongoose.
   */
  updatedAt: Date;

  /**
   * Soft deletion timestamp. If not null, indicates this session is logically deleted.
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method to create a new Session instance from domain DTO.
   *
   * @param dto - Data transfer object containing session properties.
   * @param dto.userId - ID of the user owning the session.
   * @param dto.deviceId - Unique identifier of the device.
   * @param dto.deviceName - Name/description of the device.
   * @param dto.ip - IP address of the device/session.
   * @param dto.iat - Issued At timestamp.
   * @param dto.exp - Expiration timestamp.
   * @returns A new instance of SessionDocument.
   */
  static createInstance(dto: CreateSessionDomainDto): SessionDocument {
    const session = new this();

    session.userId = dto.userId;
    session.deviceId = dto.deviceId;
    session.deviceName = dto.deviceName;
    session.ip = dto.ip;
    session.iat = dto.iat;
    session.exp = dto.exp;

    return session as SessionDocument;
  }

  /**
   * Updates the session's issued-at (`iat`) and expiration (`exp`) timestamps.
   *
   * Converts UNIX timestamps (in seconds) to JavaScript `Date` objects and assigns them
   * to the corresponding properties of the session.
   *
   * @param iat - The new "issued at" timestamp in UNIX seconds.
   * @param exp - The new "expiration" timestamp in UNIX seconds.
   *
   * This method is useful when refreshing a session or updating JWT token-related metadata.
   */
  updateTimestamps(iat: number, exp: number) {
    this.iat = new Date(iat * 1000);
    this.exp = new Date(exp * 1000);
  }

  /**
   * Marks the session as deleted by setting the deletedAt timestamp to the current date.
   * Throws an exception if the session is already deleted.
   */
  delete() {
    makeDeleted.call(this);
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.loadClass(Session);

export type SessionDocument = HydratedDocument<Session>;

export type SessionModelType = Model<SessionDocument> & typeof Session;
