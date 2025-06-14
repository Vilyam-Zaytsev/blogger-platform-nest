import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Embedded schema representing the basic information about the user
 * who created a comment.
 *
 * This schema is marked with `{ _id: false }` to indicate that it is a subdocument
 * and does not require its own `_id` field. It is typically embedded within
 * a parent `Comment` document to store denormalized data about the commentator.
 *
 * Fields:
 * - `userId`: The unique identifier of the user who wrote the comment.
 * - `userLogin`: The login name (username) of the user at the time the comment was created.
 *
 * This structure allows comments to remain consistent even if the user's login
 * changes later, as it captures a snapshot of the user's identity at the moment
 * the comment was made.
 */
@Schema({ _id: false })
export class CommentatorInfo {
  /**
   * The unique identifier of the user who authored the comment.
   *
   * This ID is typically a string (e.g., UUID or MongoDB ObjectId in string format)
   * that refers to a user in the Users collection. It allows the system to
   * establish a reference to the original author of the comment, even if their
   * username or other details change in the future.
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * The login (username) of the user at the time the comment was created.
   *
   * This value is stored denormalized within the comment for performance reasons,
   * so that the login is immediately available without querying the Users collection.
   * Even if the user changes their login later, this field preserves the original
   * context of the comment.
   */
  @Prop({ type: String, required: true })
  userLogin: string;
}

export const CommentatorInfoSchema =
  SchemaFactory.createForClass(CommentatorInfo);
