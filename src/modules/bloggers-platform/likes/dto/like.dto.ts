import { LikeStatus } from '../domain/like.entity';

export class CreateLikeDto {
  status: LikeStatus;
  userId: string;
  parentId: string;
}

export class UpdateReactionDto extends CreateLikeDto {}
