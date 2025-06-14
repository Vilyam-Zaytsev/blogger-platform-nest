import { InjectModel } from '@nestjs/mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCommentDto } from '../../dto/comment.dto';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { CreateCommentDomainDto } from '../../domain/dto/create-comment.domain.dto';
import { UserDocument } from '../../../../user-accounts/domain/user.entity';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { CommentsRepository } from '../../infrastructure/comments-repository';

export class CreateCommentCommand {
  constructor(public readonly dto: CreateCommentDto) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute({ dto }: CreateCommentCommand): Promise<string> {
    await this.postsRepository.getByIdOrNotFoundFail(dto.postId);
    const user: UserDocument = await this.usersRepository.getByIdOrNotFoundFail(
      dto.userId,
    );

    const commentDomainDto: CreateCommentDomainDto = {
      postId: dto.postId,
      content: dto.content,
      commentatorId: dto.userId,
      commentatorLogin: user.login,
    };

    const comment: CommentDocument =
      this.CommentModel.createInstance(commentDomainDto);

    return await this.commentsRepository.save(comment);
  }
}
