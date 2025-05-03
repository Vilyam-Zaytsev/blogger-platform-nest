import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReactionsCount, ReactionsCountSchema } from './reactions-count.schema';
import { LastLike, LastLikeSchema } from './last-likes.schema';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostDto } from '../dto/post.dto';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';

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
  @Prop({ type: String, required: true })
  title: string;

  /**
   * Short description of the post.
   * Used in previews and listings.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  shortDescription: string;

  /**
   * Full content of the post.
   * May include markdown, plain text, or HTML depending on use case.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
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
   * Factory method for creating a new Post instance from a DTO.
   *
   * Initializes a Post entity with basic properties such as title, description, content, and blog reference.
   * This method is typically used during post creation before saving the document to the database.
   *
   * @param {CreatePostDto} dto - Data transfer object containing post creation data.
   * @returns {PostDocument} A new Post document instance ready to be persisted.
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
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
