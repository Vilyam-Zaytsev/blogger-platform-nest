import { ReactionStatus } from '../../../reactions/domain/reaction.entity';

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export class ReactionInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatus;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  likesInfo: ReactionInfoViewDto;
  createdAt: string;

  // static mapToView(comment: CommentDocument): CommentViewDto {
  //   const dto = new this();
  //
  //   dto.id = comment.id;
  //   dto.content = comment.content;
  //   dto.
  // };
}
