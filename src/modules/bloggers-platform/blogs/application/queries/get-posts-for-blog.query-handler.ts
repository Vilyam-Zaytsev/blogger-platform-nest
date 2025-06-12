import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from '../../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../../posts/api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../../posts/infrastructure/query/posts.query-repository';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';

export class GetPostsForBlogQuery {
  constructor(
    public readonly queryParams: GetPostsQueryParams,
    public readonly user: UserContextDto | null,
    public readonly blogId: string,
  ) {}
}

@QueryHandler(GetPostsForBlogQuery)
export class GetPostsForBlogQueryHandler
  implements IQueryHandler<GetPostsForBlogQuery, PaginatedViewDto<PostViewDto>>
{
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute({
    queryParams,
    user,
    blogId,
  }: GetPostsForBlogQuery): Promise<PaginatedViewDto<PostViewDto>> {
    if (blogId) {
      await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    }

    return this.postsQueryRepository.getAll(queryParams, user, blogId);
  }
}
