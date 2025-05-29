import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BlogViewDto } from '../../api/view-dto/blog-view.dto';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';

export class GetBlogQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetBlogQuery)
export class GetBlogsQueryHandler
  implements IQueryHandler<GetBlogQuery, BlogViewDto>
{
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}

  async execute({ id }: GetBlogQuery): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
