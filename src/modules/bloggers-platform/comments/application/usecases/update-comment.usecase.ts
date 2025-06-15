import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentDto } from '../../dto/comment.dto';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { CommentDocument } from '../../domain/comment.entity';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public readonly dto: UpdateCommentDto,
    public readonly id: string,
    public readonly user: UserContextDto,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute({ dto, id, user }: UpdateCommentCommand): Promise<string> {
    const comment: CommentDocument =
      await this.commentsRepository.getByIdOrNotFoundFail(id);

    if (comment.commentatorInfo.userId !== user.id) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `The user with the ID (${id}) is not the owner of this comment`,
      });
    }

    comment.update(dto);

    return this.commentsRepository.save(comment);
  }
}
