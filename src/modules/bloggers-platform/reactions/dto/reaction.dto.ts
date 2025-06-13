import { ReactionStatus } from '../domain/reaction.entity';

export class CreateReactionDto {
  status: ReactionStatus;
  userId: string;
  parentId: string;
}

export class UpdateReactionDto extends CreateReactionDto {}
