import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateLikeDto } from '../dto/like.dto';
import { HydratedDocument, Model } from 'mongoose';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Schema({ timestamps: true })
export class Like {
  @Prop({
    type: String,
    required: true,
    enum: LikeStatus,
    default: LikeStatus.None,
  })
  status: LikeStatus;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  createdAt: Date;

  updatedAt: Date;

  static createInstance(dto: CreateLikeDto): LikeDocument {
    const { status, userId, parentId } = dto;

    const like = new this();

    like.status = status;
    like.userId = userId;
    like.parentId = parentId;

    return like as LikeDocument;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.loadClass(Like);

export type LikeDocument = HydratedDocument<Like>;

export type LikeModelType = Model<LikeDocument> & typeof Like;
