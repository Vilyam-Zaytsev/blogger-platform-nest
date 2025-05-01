import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateBlogDto, UpdateBlogDto } from './dto/createBlogDto';
import { HydratedDocument, Model } from 'mongoose';
import { UserDocument } from '../../user-accounts/domain/user.entity';
import { BlogInputDto } from '../api/input-dto/blog-input.dto';

/**
 * Blog Entity Schema
 * Represents a blog with its metadata, configuration, and deletion status.
 */
@Schema({ timestamps: true })
export class Blog {
  /**
   * Title of the blog.
   * Must be a non-empty string.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  name: string;

  /**
   * Description of the blog.
   * Can contain information about the blog's purpose, content, or target audience.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  description: string;

  /**
   * URL of the blog's website.
   * Used for redirecting users or displaying blog previews.
   *
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  websiteUrl: string;

  /**
   * Indicates whether the blog has restricted membership.
   * If set to true, access to content or actions may be limited to members only.
   *
   * @type {boolean}
   * @default false
   */
  @Prop({ type: Boolean, default: false })
  isMembership: boolean;

  /**
   * Timestamp indicating when the blog was created.
   * Automatically set by Mongoose.
   *
   * @type {Date}
   */
  createdAt: Date;

  /**
   * Timestamp indicating the last time the blog was updated.
   * Automatically managed by Mongoose.
   *
   * @type {Date}
   */
  updatedAt: Date;

  /**
   * Timestamp indicating when the blog was soft-deleted.
   * A null value means the blog is currently active.
   * Used for implementing soft delete logic.
   *
   * @type {Date | null}
   * @default null
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Factory method for creating a new Blog instance from a DTO.
   *
   * Initializes the blog entity with the provided name, description, and website URL.
   * This method is typically used when registering a new blog in the system.
   *
   * @param {CreateBlogDto} dto - Data transfer object containing blog creation details.
   * @returns {BlogDocument} A new Blog document instance ready to be saved to the database.
   */
  static createInstance(dto: CreateBlogDto): BlogDocument {
    const { name, description, websiteUrl } = dto;

    const blog = new this();

    blog.name = name;
    blog.description = description;
    blog.websiteUrl = websiteUrl;

    return blog as BlogDocument;
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
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(data: UpdateBlogDto) {
    this.name = data.name;
    this.description = data.description;
    this.websiteUrl = data.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
