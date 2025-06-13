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
import {
  NewestLike,
  NewestLikeSchema,
} from '../../posts/domain/newest-like.schema';

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
   * An array of the most recent likes (up to 3).
   *
   * Stores minimal information (userId, login, timestamp) for each like,
   * typically for UI display of recent activity.
   */
  @Prop({ type: [NewestLikeSchema], default: [] })
  newestLikes: NewestLike[];

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
    comment.newestLikes = [];

    return comment as CommentDocument;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;

export type CommentModelType = Model<CommentDocument> & typeof Comment;
