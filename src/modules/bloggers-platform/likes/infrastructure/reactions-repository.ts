import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Reaction,
  ReactionDocument,
  ReactionModelType,
  ReactionStatus,
} from '../domain/reaction.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ReactionsRepository {
  constructor(
    @InjectModel(Reaction.name)
    private readonly ReactionModel: ReactionModelType,
  ) {}
  async getByIdOrNotFoundFail(id: string): Promise<ReactionDocument> {
    const reaction: ReactionDocument | null = await this.ReactionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!reaction) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The reaction with ID (${id}) does not exist`,
      });
    }

    return reaction;
  }

  async getByUserIdAndParentId(
    userId: string,
    parentId: string,
  ): Promise<ReactionDocument | null> {
    return this.ReactionModel.findOne({
      userId,
      parentId,
      deletedAt: null,
    });
  }

  async getByParentIds(parentIds: string[]): Promise<ReactionDocument[]> {
    return this.ReactionModel.find({
      parentId: { $in: parentIds },
    });
  }

  async getRecentLikesForOnePost(
    parentId: string,
  ): Promise<ReactionDocument[]> {
    const filter = {
      status: ReactionStatus.Like,
      parentId,
    };

    return await this.ReactionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(3)
      .exec();
  }

  async save(reaction: ReactionDocument): Promise<string> {
    const resultSave: ReactionDocument = await reaction.save();

    return resultSave._id.toString();
  }
}
