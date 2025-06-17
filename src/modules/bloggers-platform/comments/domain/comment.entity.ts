import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import {
  ReactionsCount,
  ReactionsCountSchema,
} from '../../posts/domain/reactions-count.schema';
import { HydratedDocument, Model } from 'mongoose';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { UpdateCommentDto } from '../dto/comment.dto';
import {
  makeDeleted,
  recalculateReactionsCount,
} from '../../../../core/utils/entity.common-utils';
import { ReactionStatusDelta } from '../../reactions/domain/reaction.entity';

/**
 * Represents a comment left by a user on a specific post.
 *
 * This schema stores information about the comment content, the author,
 * reaction metrics, and metadata such as creation/update timestamps.
 */
@Schema({ timestamps: true })
export class Comment {
  /**
   * The unique identifier of the post this comment belongs to.
   *
   * This field is used to associate the comment with a specific post.
   */
  @Prop({ type: String, required: true })
  postId: string;

  /**
   * The textual content of the comment.
   *
   * This field contains the actual message or opinion shared by the user.
   */
  @Prop({ type: String, required: true })
  content: string;

  /**
   * Information about the author of the comment.
   *
   * Includes the user ID and login name. Stored denormalized for performance
   * and historical accuracy (e.g., login at time of commenting).
   */
  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;

  /**
   * Object containing the total number of likes and dislikes.
   *
   * Used to quickly retrieve reaction counts without querying individual reactions.
   */
  @Prop({ type: ReactionsCountSchema, required: true })
  reactionsCount: ReactionsCount;

  /**
   * The timestamp when the comment was created.
   *
   * Automatically managed by Mongoose via the `timestamps` option.
   */
  createdAt: Date;

  /**
   * The timestamp when the comment was last updated.
   *
   * Automatically managed by Mongoose via the `timestamps` option.
   */
  updatedAt: Date;

  /**
   * The timestamp when the comment was deleted.
   *
   * If `null`, the comment is considered active. A non-null value indicates a soft deletion.
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method to create a new `Comment` instance from a DTO.
   *
   * @param dto - The data transfer object containing input data for comment creation.
   * @returns A new initialized `CommentDocument` instance.
   */
  static createInstance(dto: CreateCommentDomainDto): CommentDocument {
    const { postId, content, commentatorId, commentatorLogin } = dto;

    const comment = new this();

    comment.postId = postId;
    comment.content = content;
    comment.commentatorInfo = {
      userId: commentatorId,
      userLogin: commentatorLogin,
    };
    comment.reactionsCount = new ReactionsCount();

    return comment as CommentDocument;
  }

  /**
   * Updates the content of the comment.
   *
   * @param data - An object containing the updated comment content.
   * @param data.content - The new text content of the comment.
   *
   * This method is typically used when editing an existing comment.
   * It replaces the current comment content with the new value provided.
   */
  update(data: UpdateCommentDto) {
    this.content = data.content;
  }

  /**
   * Updates the count of likes and dislikes based on the current and previous user reaction.
   *
   * This method adjusts the `reactionsCount` object by decrementing the count of the previous reaction
   * (if it exists) and incrementing the count of the current reaction (if it exists).
   * It is typically used when a user adds, removes, or changes their reaction (like/dislike) to a post or comment.
   *
   * @param {ReactionChange} statusDelta - An object containing the current and previous reactions.
   * @param {'Like' | 'Dislike' | null} statusDelta.currentReaction - The new reaction provided by the user, or `null` if removed.
   * @param {'Like' | 'Dislike' | null} statusDelta.previousReaction - The old reaction that is being replaced or removed, or `null` if none existed.
   *
   * @throws Will not throw, but assumes `reactionsCount` contains valid numeric keys `likesCount` and `dislikesCount`.
   */
  updateReactionsCount(statusDelta: ReactionStatusDelta) {
    recalculateReactionsCount.call(this, statusDelta);
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
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
