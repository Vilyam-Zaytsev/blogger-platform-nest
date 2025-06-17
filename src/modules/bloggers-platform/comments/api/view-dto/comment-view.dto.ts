import { CommentatorInfo } from '../../domain/commentator-info.schema';
import { CommentDocument } from '../../domain/comment.entity';
import { ReactionStatus } from '../../../reactions/domain/reaction.entity';

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfo;
  likesInfo: ReactionsInfo;
  createdAt: string;

  static mapToView(
    comment: CommentDocument,
    myStatus: ReactionStatus,
  ): CommentViewDto {
    const dto = new this();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    dto.likesInfo = {
      likesCount: comment.reactionsCount.likesCount,
      dislikesCount: comment.reactionsCount.dislikesCount,
      myStatus,
    };
    dto.createdAt = comment.createdAt.toISOString();

    return dto;
  }
}

export type ReactionsInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: ReactionStatus;
};
