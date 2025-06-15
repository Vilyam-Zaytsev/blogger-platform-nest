import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentViewDto } from '../../api/view-dto/comment-view.dto';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';

export class GetCommentQuery {
  constructor(
    public readonly id: string,
    public readonly user: UserContextDto | null,
  ) {}
}

@QueryHandler(GetCommentQuery)
export class GetCommentQueryHandler
  implements IQueryHandler<GetCommentQuery, CommentViewDto>
{
  constructor(
    private readonly commentQueryRepository: CommentsQueryRepository,
  ) {}

  async execute({ id, user }: GetCommentQuery): Promise<CommentViewDto> {
    return this.commentQueryRepository.getByIdOrNotFoundFail(id, user);
  }
}
