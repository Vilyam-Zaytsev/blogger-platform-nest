import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ReactionChange,
  ReactionsCount,
  ReactionsCountSchema,
} from './reactions-count.schema';
import { LastLike, LastLikeSchema } from './last-likes.schema';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDto } from '../dto/post.dto';
import {
  makeDeleted,
  recalculateReactionsCount,
} from '../../../../core/utils/entity.common-utils';

export const titleConstraints = {
  maxLength: 30,
};

export const shortDescriptionConstraints = {
  maxLength: 100,
};

export const contentConstraints = {
  maxLength: 1000,
};

/**
 * Post Entity Schema
 *
 * Represents a blog post with content, metadata, reaction statistics,
 * and optional soft-deletion. Includes references to the blog it belongs to.
 */
@Schema({ timestamps: true })
export class Post {
  /**
   * Title of the post.
   * Should be concise and informative.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...titleConstraints })
  title: string;

  /**
   * Short description of the post.
   * Used in previews and listings.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...shortDescriptionConstraints })
  shortDescription: string;

  /**
   * Full content of the post.
   * May include markdown, plain text, or HTML depending on use case.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...contentConstraints })
  content: string;

  /**
   * Identifier of the blog to which the post belongs.
   * Should match the blog's ID in the database.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  blogId: string;

  /**
   * Name of the blog at the time the post was created.
   * Stored to preserve historical context even if the blog name changes.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  blogName: string;

  /**
   * Reaction statistics for the post.
   * Contains the number of likes and dislikes.
   *
   * @type {ReactionsCount}
   * @required
   */
  @Prop({ type: ReactionsCountSchema, required: true })
  reactionsCount: ReactionsCount;

  /**
   * List of the most recent likes.
   * Each entry includes user ID, login, and the timestamp of the like.
   *
   * @type {LastLike[]}
   * @default []
   */
  @Prop({ type: [LastLikeSchema], default: [] })
  lastLikes: LastLike[];

  /**
   * Timestamp indicating when the post was created.
   * Automatically set by Mongoose.
   *
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp indicating when the post was last updated.
   * Automatically updated by Mongoose.
   *
   * @type {Date}
   */
  updatedAt: Date;

  /**
   * Timestamp indicating when the post was soft-deleted.
   * Null if the post is currently active.
   *
   * @type {Date | null}
   * @default null
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method for creating a new Post instance from a domain DTO.
   *
   * Initializes a Post entity with core fields such as title, description, content, blog information,
   * and default values for reactions and recent likes. This method ensures the post is ready for persistence
   * with all required fields properly set.
   *
   * @param {CreatePostDomainDto} dto - Domain-specific DTO containing data needed to create a new post.
   * @returns {PostDocument} A fully initialized Post document instance.
   */
  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const { title, shortDescription, content, blogId } = dto;

    const post = new this();

    post.title = title;
    post.shortDescription = shortDescription;
    post.content = content;
    post.blogId = blogId;
    post.blogName = dto.blogName;
    post.reactionsCount = new ReactionsCount();
    post.lastLikes = [];

    return post as PostDocument;
  }

  /**
   * Updates the current Post instance with new data.
   *
   * Replaces the post's title, short description, content, and blog reference
   * based on the provided DTO. Typically used when editing an existing post.
   *
   * @param {UpdatePostDto} data - DTO containing the updated post data.
   */
  update(data: UpdatePostDto) {
    this.title = data.title;
    this.shortDescription = data.shortDescription;
    this.content = data.content;
    this.blogId = data.blogId;
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
   * Updates the count of likes and dislikes based on the current and previous user reaction.
   *
   * This method adjusts the `reactionsCount` object by decrementing the count of the previous reaction
   * (if it exists) and incrementing the count of the current reaction (if it exists).
   * It is typically used when a user adds, removes, or changes their reaction (like/dislike) to a post or comment.
   *
   * @param {ReactionChange} delta - An object containing the current and previous reactions.
   * @param {'Like' | 'Dislike' | null} delta.currentReaction - The new reaction provided by the user, or `null` if removed.
   * @param {'Like' | 'Dislike' | null} delta.previousReaction - The old reaction that is being replaced or removed, or `null` if none existed.
   *
   * @throws Will not throw, but assumes `reactionsCount` contains valid numeric keys `likesCount` and `dislikesCount`.
   */
  updateReactionsCount(delta: ReactionChange) {
    recalculateReactionsCount.call(this, delta);
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
