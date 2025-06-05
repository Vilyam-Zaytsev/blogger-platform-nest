import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Like,
  LikeDocument,
  LikeModelType,
  LikeStatus,
} from '../domain/like.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel(Like.name) private readonly LikeModel: LikeModelType,
  ) {}
  async getByIdOrNotFoundFail(id: string): Promise<LikeDocument> {
    const like: LikeDocument | null = await this.LikeModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!like) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The like with ID (${id}) does not exist`,
      });
    }

    return like;
  }

  async getLikeByUserIdAndParentId(
    userId: string,
    parentId: string,
  ): Promise<LikeDocument | null> {
    return this.LikeModel.findOne({
      userId,
      parentId,
      deletedAt: null,
    });
  }

  async getReactionsByParentIds(parentIds: string[]): Promise<LikeDocument[]> {
    return this.LikeModel.find({
      parentId: { $in: parentIds },
    });
  }

  async save(like: LikeDocument): Promise<string> {
    const resultSave: LikeDocument = await like.save();

    return resultSave._id.toString();
  }
}
