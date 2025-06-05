import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';

export class GetPostsQuery {
  constructor(
    public readonly queryParams: GetPostsQueryParams,
    public readonly user: UserContextDto | null,
  ) {}
}

@QueryHandler(GetPostsQuery)
export class GetPostsQueryHandler
  implements IQueryHandler<GetPostsQuery, PaginatedViewDto<PostViewDto>>
{
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute({
    queryParams,
    user,
  }: GetPostsQuery): Promise<PaginatedViewDto<PostViewDto>> {
    return this.postsQueryRepository.getAll(queryParams, user);
  }
}
