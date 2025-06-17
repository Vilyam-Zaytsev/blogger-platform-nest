import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IdInputDto } from '../../../user-accounts/api/input-dto/id.input-dto';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { CommentViewDto } from './view-dto/comment-view.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetCommentQuery } from '../application/queries/get-comment.query-handler';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { CommentInputDto } from './input-dto/comment-input.dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecase';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/extract-user-from-request.decorator';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-pipe';
import { ReactionInputDto } from '../../reactions/api/input-dto/reaction-input.dto';
import { UpdateReactionDto } from '../../reactions/dto/reaction.dto';
import { UpdateCommentReactionCommand } from '../application/usecases/update-comment-reaction.usecase';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getById(
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
    @Param() params: IdInputDto,
  ): Promise<CommentViewDto> {
    return this.queryBus.execute(new GetCommentQuery(params.id, user));
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() params: IdInputDto,
    @Body() body: CommentInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateCommentCommand(body, params.id, user),
    );
  }

  @Put(':commentId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateReaction(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('commentId', ObjectIdValidationPipe) commentId: string,
    @Body() body: ReactionInputDto,
  ): Promise<void> {
    const updateReactionDto: UpdateReactionDto = {
      status: body.likeStatus,
      userId: user.id,
      parentId: commentId,
    };

    await this.commandBus.execute(
      new UpdateCommentReactionCommand(updateReactionDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() params: IdInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteCommentCommand(params.id, user));
  }
}
