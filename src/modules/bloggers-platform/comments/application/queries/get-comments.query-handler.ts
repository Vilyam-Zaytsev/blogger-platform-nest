import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../api/view-dto/comment-view.dto';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class GetCommentsQuery {
  constructor(
    public readonly queryParams: GetCommentsQueryParams,
    public readonly user: UserContextDto | null,
    public readonly postId: string,
  ) {}
}

@QueryHandler(GetCommentsQuery)
export class GetCommentsQueryHandler
  implements IQueryHandler<GetCommentsQuery, PaginatedViewDto<CommentViewDto>>
{
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute({
    queryParams,
    user,
    postId,
  }: GetCommentsQuery): Promise<PaginatedViewDto<CommentViewDto>> {
    await this.postsRepository.getByIdOrNotFoundFail(postId);

    return this.commentsQueryRepository.getAll(queryParams, user, postId);
  }
}
