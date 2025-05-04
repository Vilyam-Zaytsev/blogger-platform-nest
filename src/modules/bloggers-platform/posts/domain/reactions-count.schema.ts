import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * ReactionsCount Embedded Schema
 *
 * Represents the count of positive and negative reactions (likes and dislikes)
 * associated with a specific entity (e.g., post, comment).
 * This schema is designed to be embedded and does not have its own _id.
 */
@Schema({ _id: false })
export class ReactionsCount {
  /**
   * Total number of likes.
   * Increments when a user reacts positively to the associated entity.
   *
   * @type {number}
   * @default 0
   */
  @Prop({ type: Number, default: 0 })
  likesCount: number;

  /**
   * Total number of dislikes.
   * Increments when a user reacts negatively to the associated entity.
   *
   * @type {number}
   * @default 0
   */
  @Prop({ type: Number, default: 0 })
  dislikesCount: number;
}

export const ReactionsCountSchema =
  SchemaFactory.createForClass(ReactionsCount);
