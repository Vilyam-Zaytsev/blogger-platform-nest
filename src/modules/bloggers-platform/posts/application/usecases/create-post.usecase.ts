import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreatePostDomainDto } from '../../domain/dto/create-post.domain.dto';
import { CreatePostDto } from '../../dto/post.dto';
import { BlogDocument } from '../../../blogs/domain/blog.entity';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';

@Injectable()
export class CreatePostUseCase {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
    @InjectModel(Post.name) private PostModel: PostModelType,
  ) {}

  async execute(dto: CreatePostDto): Promise<string> {
    const { title, shortDescription, content, blogId } = dto;

    const blog: BlogDocument =
      await this.blogsRepository.getByIdOrNotFoundFail(blogId);

    const postDomainDto: CreatePostDomainDto = {
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
    };

    const post: PostDocument = this.PostModel.createInstance(postDomainDto);

    return await this.postsRepository.save(post);
  }
}
