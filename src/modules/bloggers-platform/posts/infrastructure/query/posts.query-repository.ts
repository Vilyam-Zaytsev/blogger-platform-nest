import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post-view.dto';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const post: PostDocument | null = await this.PostModel.findOne({
      _id: id,
      deleted: null,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return PostViewDto.mapToView(post);
  }

  // async getAll(
  //   query: GetBlogsQueryParams,
  // ): Promise<PaginatedViewDto<BlogViewDto>> {
  //   const filter: FilterQuery<Blog> = {
  //     deletedAt: null,
  //   };
  //
  //   if (query.searchNameTerm) {
  //     filter.$or = filter.$or || [];
  //     filter.$or.push({
  //       login: { $regex: query.searchNameTerm, $options: 'i' },
  //     });
  //   }
  //
  //   const blogs: BlogDocument[] = await this.BlogModel.find(filter)
  //     .sort({ [query.sortBy]: query.sortDirection })
  //     .skip(query.calculateSkip())
  //     .limit(query.pageSize);
  //
  //   const totalCount: number = await this.BlogModel.countDocuments(filter);
  //
  //   const items: BlogViewDto[] = blogs.map(
  //     (blog: BlogDocument): BlogViewDto => BlogViewDto.mapToView(blog),
  //   );
  //
  //   return PaginatedViewDto.mapToView<BlogViewDto>({
  //     items,
  //     totalCount,
  //     page: query.pageNumber,
  //     size: query.pageSize,
  //   });
  // }
}
