import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ReactionDocument,
  ReactionStatus,
} from '../../../reactions/domain/reaction.entity';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { CommentViewDto } from '../../api/view-dto/comment-view.dto';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { ReactionsRepository } from '../../../reactions/infrastructure/reactions-repository';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    private readonly reactionsRepository: ReactionsRepository,
  ) {}
  async getByIdOrNotFoundFail(
    id: string,
    user?: UserContextDto | null,
  ): Promise<CommentViewDto> {
    const comment: CommentDocument | null = await this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The comment with ID (${id}) does not exist`,
      });
    }

    let userReactionStatus: ReactionStatus = ReactionStatus.None;

    if (user) {
      const reaction: ReactionDocument | null =
        await this.reactionsRepository.getByUserIdAndParentId(
          user.id,
          comment._id.toString(),
        );

      userReactionStatus = reaction ? reaction.status : ReactionStatus.None;
    }

    return CommentViewDto.mapToView(comment, userReactionStatus);
  }

  // async getLikeByUserIdAndParentId(
  //   userId: string,
  //   parentId: string,
  // ): Promise<ReactionDocument | null> {
  //   return this.LikeModel.findOne({
  //     userId,
  //     parentId,
  //     deletedAt: null,
  //   });
  // }
  //
  // async getReactionsByParentIds(
  //   parentIds: string[],
  // ): Promise<ReactionDocument[]> {
  //   return this.LikeModel.find({
  //     parentId: { $in: parentIds },
  //   });
  // }
  //
  // async getRecentLikesForOnePost(
  //   parentId: string,
  // ): Promise<ReactionDocument[]> {
  //   const filter = {
  //     status: ReactionStatus.Like,
  //     parentId,
  //   };
  //
  //   return await this.LikeModel.find(filter)
  //     .sort({ createdAt: -1 })
  //     .limit(3)
  //     .exec();
  // }
  //
  // async save(like: ReactionDocument): Promise<string> {
  //   const resultSave: ReactionDocument = await like.save();
  //
  //   return resultSave._id.toString();
  // }
}
