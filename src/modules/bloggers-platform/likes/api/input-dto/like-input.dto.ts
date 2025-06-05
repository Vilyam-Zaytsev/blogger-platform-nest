import { LikeStatus } from '../../domain/like.entity';
import { IsEnum } from 'class-validator';

export class LikeInputDto {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
