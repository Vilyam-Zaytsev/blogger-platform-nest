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
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { DeletePostCommand } from '../../posts/application/usecases/delete-post.usecase';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecase';

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
