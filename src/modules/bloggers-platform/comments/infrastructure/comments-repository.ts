import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Reaction,
  ReactionModelType,
} from '../../reactions/domain/reaction.entity';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
  ) {}
  // async getByIdOrNotFoundFail(id: string): Promise<ReactionDocument> {
  //   const like: ReactionDocument | null = await this.LikeModel.findOne({
  //     _id: id,
  //     deletedAt: null,
  //   });
  //
  //   if (!like) {
  //     throw new DomainException({
  //       code: DomainExceptionCode.NotFound,
  //       message: `The like with ID (${id}) does not exist`,
  //     });
  //   }
  //
  //   return like;
  // }
  //
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

  async save(comment: CommentDocument): Promise<string> {
    const resultSave: CommentDocument = await comment.save();

    return resultSave._id.toString();
  }
}
