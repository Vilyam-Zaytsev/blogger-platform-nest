import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { AdminCredentials } from '../types';
import { GetPostsQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';

export class PostsTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentials: AdminCredentials,
  ) {}

  // async createBlog(quantity: number): Promise<BlogViewDto[]> {
  //   const newBlogs: BlogViewDto[] = [];
  //   const dtos: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(quantity);
  //
  //   for (let i = 0; i < quantity; i++) {
  //     const blog: BlogInputDto = dtos[i];
  //
  //     const response: Response = await request(this.server)
  //       .post(`/${GLOBAL_PREFIX}/blogs`)
  //       .send(blog)
  //       .set(
  //         'Authorization',
  //         TestUtils.encodingAdminDataInBase64(
  //           this.adminCredentials.login,
  //           this.adminCredentials.password,
  //         ),
  //       )
  //       .expect(201);
  //
  //     const newBlog: BlogViewDto = response.body as BlogViewDto;
  //
  //     expect(typeof newBlog.id).toBe('string');
  //     expect(new Date(newBlog.createdAt).toString()).not.toBe('Invalid Date');
  //     expect(newBlog.name).toBe(blog.name);
  //     expect(newBlog.description).toBe(blog.description);
  //     expect(newBlog.websiteUrl).toBe(blog.websiteUrl);
  //     expect(typeof newBlog.isMembership).toBe('boolean');
  //
  //     newBlogs.push(newBlog);
  //   }
  //
  //   return newBlogs;
  // }

  async getAll(
    query: Partial<GetPostsQueryParams> = {},
  ): Promise<PaginatedViewDto<PostViewDto>> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .query(query)
      .expect(200);

    return response.body as PaginatedViewDto<PostViewDto>;
  }

  // async getById(id: string): Promise<BlogViewDto> {
  //   const response: Response = await request(this.server)
  //     .get(`/${GLOBAL_PREFIX}/blogs/${id}`)
  //     .expect(200);
  //
  //   return response.body as BlogViewDto;
  // }
}
