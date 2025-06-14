import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { IdInputDto } from '../../../user-accounts/api/input-dto/id.input-dto';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CommentViewDto } from './view-dto/comment-view.dto';
import { QueryBus } from '@nestjs/cqrs';
import { GetCommentQuery } from '../application/queries/get-comment.query-handler';

@Controller('comments')
export class CommentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getById(
    @Param() params: IdInputDto,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<CommentViewDto> {
    return this.queryBus.execute(new GetCommentQuery(params.id, user));
  }
}
