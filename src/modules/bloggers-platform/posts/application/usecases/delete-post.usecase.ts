import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';

@Injectable()
export class DeletePostUseCase {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(id: string): Promise<string> {
    const post: PostDocument =
      await this.postsRepository.getByIdOrNotFoundFail(id);

    post.makeDeleted();

    return this.postsRepository.save(post);
  }
}
