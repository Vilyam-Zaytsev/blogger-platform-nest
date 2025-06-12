import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateReactionDto } from '../dto/reaction.dto';
import { HydratedDocument, Model } from 'mongoose';

export enum ReactionStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Schema({ timestamps: true })
export class Reaction {
  @Prop({
    type: String,
    required: true,
    enum: ReactionStatus,
    default: ReactionStatus.None,
  })
  status: ReactionStatus;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;

  static createInstance(dto: CreateReactionDto): ReactionDocument {
    const { status, userId, parentId } = dto;

    const reaction = new this();

    reaction.status = status;
    reaction.userId = userId;
    reaction.parentId = parentId;

    return reaction as ReactionDocument;
  }

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
