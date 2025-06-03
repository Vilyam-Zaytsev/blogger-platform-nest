import { LikeStatus } from '../../../likes/domain/like.entity';

export type CommentatorInfo = {
  userId: string;
  userLogin: string;
};

export class LikeInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  likesInfo: LikeInfoViewDto;
  createdAt: string;

  // static mapToView(comment: CommentDocument): CommentViewDto {
  //   const dto = new this();
  //
  //   dto.id = comment.id;
  //   dto.content = comment.content;
  //   dto.
  // };
}
