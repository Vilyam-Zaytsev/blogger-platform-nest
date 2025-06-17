import request, { Response } from 'supertest';
import { Server } from 'http';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { HttpStatus } from '@nestjs/common';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { CommentInputDto } from '../../src/modules/bloggers-platform/comments/api/input-dto/comment-input.dto';
import { GetPostsQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';

export class CommentsTestManager {
  constructor(private readonly server: Server) {}

  async createComment(
    quantity: number,
    postId: string,
    accessToken: string,
  ): Promise<CommentViewDto[]> {
    const newComments: CommentViewDto[] = [];
    const dtos: CommentInputDto[] =
      TestDtoFactory.generateCommentInputDto(quantity);

    for (let i = 0; i < quantity; i++) {
      const dto: CommentInputDto = dtos[i];

      const response: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
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

      newComments.push(newComment);
    }

    return newComments;
  }

  async getAll(
    query: Partial<GetPostsQueryParams> = {},
    postId: string,
    accessToken?: string,
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    let req = request(this.server)
      .get(`/${GLOBAL_PREFIX}/posts/${postId}/comments`)
      .query(query);

    if (accessToken) {
      req = req.set('Authorization', `Bearer ${accessToken}`);
    }

    const res: Response = await req.expect(HttpStatus.OK);

    return res.body as PaginatedViewDto<CommentViewDto>;
  }

  async getById(id: string, accessToken?: string): Promise<CommentViewDto> {
    let req = request(this.server).get(`/${GLOBAL_PREFIX}/comments/${id}`);

    if (accessToken) {
      req = req.set('Authorization', `Bearer ${accessToken}`);
    }

    const res: Response = await req.expect(HttpStatus.OK);

    return res.body as CommentViewDto;
  }
}
