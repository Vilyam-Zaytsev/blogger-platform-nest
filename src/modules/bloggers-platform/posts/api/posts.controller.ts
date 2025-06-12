import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostInputDto } from './input-dto/post-input.dto';
import { PostViewDto } from './view-dto/post-view.dto';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IdInputDto } from '../../../user-accounts/api/input-dto/id.input-dto';
import { GetPostsQuery } from '../application/queries/get-posts.query-handler';
import { GetPostQuery } from '../application/queries/get-post.query-handler';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { ReactionInputDto } from '../../likes/api/input-dto/reaction-input.dto';
import { ExtractUserFromRequest } from '../../../user-accounts/guards/decorators/extract-user-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';
import { UpdatePostReactionCommand } from '../application/usecases/update-post-reaction.usecase';
import { UpdateReactionDto } from '../../likes/dto/reaction.dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-pipe';
import { OptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/optional-jwt-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/extract-user-if-exists-from-request.decorator';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getAll(
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    return this.queryBus.execute(new GetPostsQuery(query, user));
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getById(
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
    @Param() params: IdInputDto,
  ): Promise<PostViewDto> {
    return this.queryBus.execute(new GetPostQuery(params.id, user));
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async createPost(@Body() body: PostInputDto): Promise<PostViewDto> {
    const postId: string = await this.commandBus.execute(
      new CreatePostCommand(body),
    );
    //TODO: получать пост через query
    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async updatePost(
    @Param() params: IdInputDto,
    @Body() body: PostInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdatePostCommand(body, params.id));
  }

  @Put(':postId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async updateReaction(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('postId', ObjectIdValidationPipe) postId: string,
    @Body() body: ReactionInputDto,
  ): Promise<void> {
    const updateReactionDto: UpdateReactionDto = {
      status: body.likeStatus,
      userId: user.id,
      parentId: postId,
    };

    await this.commandBus.execute(
      new UpdatePostReactionCommand(updateReactionDto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param() params: IdInputDto): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(params.id));
  }
}
