import { Prop, Schema } from '@nestjs/mongoose';

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
}
