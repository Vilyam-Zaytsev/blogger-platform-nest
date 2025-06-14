import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { GetPostsQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { HttpStatus } from '@nestjs/common';
import { response } from 'express';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { CommentInputDto } from '../../src/modules/bloggers-platform/comments/api/input-dto/comment-input.dto';

export class CommentsTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentialsInBase64: string,
  ) {}

  async createComment(
    quantity: number,
    accessToken: string,
  ): Promise<CommentViewDto[]> {
    const newComments: CommentViewDto[] = [];
    const dtos: CommentInputDto[] =
      TestDtoFactory.generateCommentInputDto(quantity);

    for (let i = 0; i < quantity; i++) {
      const dto: CommentInputDto = dtos[i];

      const response: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/comments`)
        .send(dto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.CREATED);

      const newComment: CommentViewDto = response.body as CommentViewDto;

      expect(typeof newComment.id).toBe('string');
      expect(new Date(newComment.createdAt).toString()).not.toBe(
        'Invalid Date',
      );
      expect(newComment.content).toBe(dto.content);
      expect(typeof newComment.likesInfo).toBe('object');
      expect(newComment.likesInfo.likesCount).toBe(0);
      expect(newComment.likesInfo.dislikesCount).toBe(0);
      expect(newComment.likesInfo.myStatus).toBe(ReactionStatus.None);
      expect(Array.isArray(newComment.likesInfo.newestLikes)).toBe(true);

      newComments.push(newComment);
    }

    return newComments;
  }

  // async getAll(
  //   query: Partial<GetPostsQueryParams> = {},
  //   accessToken?: string,
  // ): Promise<PaginatedViewDto<PostViewDto>> {
  //   let req = request(this.server).get(`/${GLOBAL_PREFIX}/posts`).query(query);
  //
  //   if (accessToken) {
  //     req = req.set('Authorization', `Bearer ${accessToken}`);
  //   }
  //
  //   const res: Response = await req.expect(HttpStatus.OK);
  //
  //   return res.body as PaginatedViewDto<PostViewDto>;
  // }
  //
  // async getById(id: string, accessToken?: string): Promise<PostViewDto> {
  //   let req = request(this.server).get(`/${GLOBAL_PREFIX}/posts/${id}`);
  //
  //   if (accessToken) {
  //     req = req.set('Authorization', `Bearer ${accessToken}`);
  //   }
  //
  //   const res: Response = await req.expect(HttpStatus.OK);
  //
  //   return res.body as PostViewDto;
  // }
}
