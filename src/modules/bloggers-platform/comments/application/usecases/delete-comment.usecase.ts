import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { CommentDocument } from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteCommentCommand {
  constructor(
    public readonly id: string,
    public readonly user: UserContextDto,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({ id, user }: DeleteCommentCommand): Promise<string> {
    const comment: CommentDocument =
      await this.commentsRepository.getByIdOrNotFoundFail(id);

    if (comment.commentatorInfo.userId !== user.id) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `The user with the ID (${id}) is not the owner of this comment`,
      });
    }

    comment.delete();

    return this.commentsRepository.save(comment);
  }
}
