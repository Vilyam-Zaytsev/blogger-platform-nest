import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreatePostDomainDto } from '../../domain/dto/create-post.domain.dto';
import { CreatePostDto } from '../../dto/post.dto';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreatePostCommand {
  constructor(public readonly dto: CreatePostDto) {}
}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
    @InjectModel(Post.name) private PostModel: PostModelType,
  ) {}

  async execute({ dto }: CreatePostCommand): Promise<string> {
    const blog: BlogDocument = await this.blogsRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const postDomainDto: CreatePostDomainDto = {
      ...dto,
      blogName: blog.name,
    };

    const post: PostDocument = this.PostModel.createInstance(postDomainDto);

    return await this.postsRepository.save(post);
  }
}
