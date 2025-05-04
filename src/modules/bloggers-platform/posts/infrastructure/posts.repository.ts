import { InjectModel } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';

export class PostsRepository {
  constructor(@InjectModel(Post.name) private PostModel: PostModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostDocument> {
    const post: PostDocument | null = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async save(post: PostDocument): Promise<string> {
    const resultSave: PostDocument = await post.save();

    return resultSave._id.toString();
  }
}
