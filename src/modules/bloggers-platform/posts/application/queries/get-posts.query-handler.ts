import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';

export class GetPostsQuery {
  constructor(public readonly queryParams: GetPostsQueryParams) {}
}

@QueryHandler(GetPostsQuery)
export class GetPostsQueryHandler
  implements IQueryHandler<GetPostsQuery, PaginatedViewDto<PostViewDto>>
{
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute({
    queryParams,
  }: GetPostsQuery): Promise<PaginatedViewDto<PostViewDto>> {
    return this.postsQueryRepository.getAll(queryParams);
  }
}
