import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateReactionDto } from '../dto/reaction.dto';
import { HydratedDocument, Model } from 'mongoose';

export enum ReactionStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

/**
 * Represents a user's reaction (like/dislike/none) to a specific entity (e.g., post or comment).
 * This schema tracks the current status of the reaction, who made it, and what entity it belongs to.
 * Includes metadata for soft deletion and automatic timestamps.
 */
@Schema({ timestamps: true })
export class Reaction {
  /**
   * Current reaction status.
   * Can be one of: Like, Dislike, or None.
   * Defaults to ReactionStatus.None.
   */
  @Prop({
    type: String,
    required: true,
    enum: ReactionStatus,
    default: ReactionStatus.None,
  })
  status: ReactionStatus;

  /**
   * ID of the user who made the reaction.
   */
  @Prop({ type: String, required: true })
  userId: string;

  /**
   * ID of the parent entity the reaction belongs to (e.g., postId or commentId).
   */
  @Prop({ type: String, required: true })
  parentId: string;

  /**
   * Soft deletion marker. If not null, indicates that the reaction has been logically deleted.
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  /**
   * Timestamp of when the reaction was created.
   * Automatically managed by Mongoose.
   */
  createdAt: Date;

  /**
   * Timestamp of when the reaction was last updated.
   * Automatically managed by Mongoose.
   */
  updatedAt: Date;

  /**
   * Factory method for creating a new Reaction instance.
   *
   * @param dto - Data required to create a new reaction.
   * @param dto.status - Initial reaction status (Like/Dislike/None).
   * @param dto.userId - ID of the user performing the reaction.
   * @param dto.parentId - ID of the parent entity being reacted to.
   * @returns A new ReactionDocument instance.
   */
  static createInstance(dto: CreateReactionDto): ReactionDocument {
    const { status, userId, parentId } = dto;

    const reaction = new this();

    reaction.status = status;
    reaction.userId = userId;
    reaction.parentId = parentId;

    return reaction as ReactionDocument;
  }

  /**
   * Updates the current reaction status.
   *
   * @param status - New reaction status (e.g., Like or Dislike).
   */
  updateStatus(status: ReactionStatus) {
    this.status = status;
  }
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);

ReactionSchema.loadClass(Reaction);

export type ReactionDocument = HydratedDocument<Reaction>;

export type ReactionModelType = Model<ReactionDocument> & typeof Reaction;

export type ReactionStatusDelta = {
  currentStatus: ReactionStatus;
  previousStatus: ReactionStatus;
};
