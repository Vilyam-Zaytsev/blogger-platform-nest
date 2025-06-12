import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * NewestLikes Embedded Schema
 *
 * Represents metadata about the most recent like on an entity (e.g., post or comment).
 * Includes the timestamp, user ID, and login of the user who performed the like action.
 * This schema is embedded and does not have its own _id.
 */
@Schema({ _id: false })
export class NewestLike {
  /**
   * Timestamp of when the like was added.
   * Represents the exact moment the user liked the entity.
   *
   * @type {Date}
   * @required
   */
  @Prop({ type: Date, required: true })
  addedAt: Date;

  /**
   * ID of the user who added the like.
   * Typically stored as a string referencing the User entity.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * Login of the user who added the like.
   * Used for display when showing recent likes.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  login: string;
}

export const NewestLikeSchema = SchemaFactory.createForClass(NewestLike);
