import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { UpdatePostDto } from '../../dto/post.dto';

@Injectable()
export class UpdatePostUseCase {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(id: string, dto: UpdatePostDto): Promise<string> {
    const post: PostDocument =
      await this.postsRepository.getByIdOrNotFoundFail(id);

    post.update(dto);

    return this.postsRepository.save(post);
  }
}
