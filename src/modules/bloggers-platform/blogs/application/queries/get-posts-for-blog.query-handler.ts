import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from '../../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../../posts/api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../../posts/infrastructure/query/posts.query-repository';

//TODO: правильно ли я формирую GetPostsForBlogQuery?
export class GetPostsForBlogQuery {
  constructor(
    public readonly queryParams: GetPostsQueryParams,
    public readonly blogId: string,
  ) {}
}

@QueryHandler(GetPostsForBlogQuery)
export class GetPostsForBlogQueryHandler
  implements IQueryHandler<GetPostsForBlogQuery, PaginatedViewDto<PostViewDto>>
{
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute({
    queryParams,
    blogId,
  }: GetPostsForBlogQuery): Promise<PaginatedViewDto<PostViewDto>> {
    return this.postsQueryRepository.getPostsByBlogId(queryParams, blogId);
  }
}
