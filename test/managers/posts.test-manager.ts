import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { GetPostsQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { ReactionStatus } from '../../src/modules/bloggers-platform/likes/domain/reaction.entity';
import { HttpStatus } from '@nestjs/common';
import { response } from 'express';

export class PostsTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentialsInBase64: string,
  ) {}

  async createPost(quantity: number, blogId: string): Promise<PostViewDto[]> {
    const newPosts: PostViewDto[] = [];
    const dtos: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      quantity,
      blogId,
    );

    for (let i = 0; i < quantity; i++) {
      const dto: PostInputDto = dtos[i];

      const response: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/posts`)
        .send(dto)
        .set('Authorization', this.adminCredentialsInBase64)
        .expect(HttpStatus.CREATED);

      const newPost: PostViewDto = response.body as PostViewDto;

      expect(typeof newPost.id).toBe('string');
      expect(new Date(newPost.createdAt).toString()).not.toBe('Invalid Date');
      expect(newPost.title).toBe(dto.title);
      expect(newPost.shortDescription).toBe(dto.shortDescription);
      expect(newPost.content).toBe(dto.content);
      expect(newPost.blogId).toBe(dto.blogId);
      expect(typeof newPost.blogName).toBe('string');
      expect(typeof newPost.extendedLikesInfo).toBe('object');
      expect(newPost.extendedLikesInfo.likesCount).toBe(0);
      expect(newPost.extendedLikesInfo.dislikesCount).toBe(0);
      expect(newPost.extendedLikesInfo.myStatus).toBe(ReactionStatus.None);
      expect(Array.isArray(newPost.extendedLikesInfo.newestLikes)).toBe(true);

      newPosts.push(newPost);
    }

    return newPosts;
  }

  async getAll(
    query: Partial<GetPostsQueryParams> = {},
    accessToken?: string,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    let req = request(this.server).get(`/${GLOBAL_PREFIX}/posts`).query(query);

    if (accessToken) {
      req = req.set('Authorization', `Bearer ${accessToken}`);
    }

    const res: Response = await req.expect(HttpStatus.OK);

    return res.body as PaginatedViewDto<PostViewDto>;
  }

  async getById(id: string, accessToken?: string): Promise<PostViewDto> {
    let req = request(this.server).get(`/${GLOBAL_PREFIX}/posts/${id}`);

    if (accessToken) {
      req = req.set('Authorization', `Bearer ${accessToken}`);
    }

    const res: Response = await req.expect(HttpStatus.OK);

    return res.body as PostViewDto;
  }
}
