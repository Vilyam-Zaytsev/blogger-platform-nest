import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
  ) {}
  async getByIdOrNotFoundFail(id: string): Promise<CommentDocument> {
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

    return comment;
  }

  async save(comment: CommentDocument): Promise<string> {
    const resultSave: CommentDocument = await comment.save();

    return resultSave._id.toString();
  }
}
