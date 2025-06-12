// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { DomainException } from '../../../../core/exceptions/damain-exceptions';
// import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
// import { ReactionDocument } from '../../likes/domain/reaction.entity';
//
// @Injectable()
// export class CommentsRepository {
//   constructor(
//     @InjectModel(Reaction.name) private readonly LikeModel: ReactionModelType,
//   ) {}
//   async getByIdOrNotFoundFail(id: string): Promise<ReactionDocument> {
//     const like: ReactionDocument | null = await this.LikeModel.findOne({
//       _id: id,
//       deletedAt: null,
//     });
//
//     if (!like) {
//       throw new DomainException({
//         code: DomainExceptionCode.NotFound,
//         message: `The like with ID (${id}) does not exist`,
//       });
//     }
//
//     return like;
//   }
//
//   async getLikeByUserIdAndParentId(
//     userId: string,
//     parentId: string,
//   ): Promise<ReactionDocument | null> {
//     return this.LikeModel.findOne({
//       userId,
//       parentId,
//       deletedAt: null,
//     });
//   }
//
//   async getReactionsByParentIds(
//     parentIds: string[],
//   ): Promise<ReactionDocument[]> {
//     return this.LikeModel.find({
//       parentId: { $in: parentIds },
//     });
//   }
//
//   async getRecentLikesForOnePost(
//     parentId: string,
//   ): Promise<ReactionDocument[]> {
//     const filter = {
//       status: ReactionStatus.Like,
//       parentId,
//     };
//
//     return await this.LikeModel.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(3)
//       .exec();
//   }
//
//   async save(like: ReactionDocument): Promise<string> {
//     const resultSave: ReactionDocument = await like.save();
//
//     return resultSave._id.toString();
//   }
// }
