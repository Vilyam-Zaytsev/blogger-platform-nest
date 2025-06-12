import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { BlogViewDto } from '../../src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { GetBlogsQueryParams } from '../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog-input.dto';
import { HttpStatus } from '@nestjs/common';

export class BlogsTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentialsInBase64: string,
  ) {}

  async createBlog(quantity: number): Promise<BlogViewDto[]> {
    const newBlogs: BlogViewDto[] = [];
    const dtos: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(quantity);

    for (let i = 0; i < quantity; i++) {
      const blog: BlogInputDto = dtos[i];

      const response: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/blogs`)
        .send(blog)
        .set('Authorization', this.adminCredentialsInBase64)
        .expect(HttpStatus.CREATED);

      const newBlog: BlogViewDto = response.body as BlogViewDto;

      expect(typeof newBlog.id).toBe('string');
      expect(new Date(newBlog.createdAt).toString()).not.toBe('Invalid Date');
      expect(newBlog.name).toBe(blog.name);
      expect(newBlog.description).toBe(blog.description);
      expect(newBlog.websiteUrl).toBe(blog.websiteUrl);
      expect(typeof newBlog.isMembership).toBe('boolean');

      newBlogs.push(newBlog);
    }

    return newBlogs;
  }

  async getAll(
    query: Partial<GetBlogsQueryParams> = {},
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    return response.body as PaginatedViewDto<BlogViewDto>;
  }

  async getById(id: string): Promise<BlogViewDto> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/blogs/${id}`)
      .expect(HttpStatus.OK);

    return response.body as BlogViewDto;
  }
}
