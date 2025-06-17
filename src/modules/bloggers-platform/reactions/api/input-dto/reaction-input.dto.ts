import { ReactionStatus } from '../../domain/reaction.entity';
import { IsEnum } from 'class-validator';

export class ReactionInputDto {
  @IsEnum(ReactionStatus)
  likeStatus: ReactionStatus;
}
