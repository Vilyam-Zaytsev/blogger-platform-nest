import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog-input.dto';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { ReactionInputDto } from '../../src/modules/bloggers-platform/likes/api/input-dto/reaction-input.dto';
import { ReactionStatus } from '../../src/modules/bloggers-platform/likes/domain/reaction.entity';

export class TestDtoFactory {
  static generateUserInputDto(quantity: number): UserInputDto[] {
    const users: UserInputDto[] = [];

    for (let i = 0; i < quantity; i++) {
      users.push({
        login: `testUser${i}`,
        email: `testUser${i}@example.com`,
        password: 'qwerty',
      });
    }

    return users;
  }

  static generateBlogInputDto(quantity: number): BlogInputDto[] {
    const blogs: BlogInputDto[] = [];

    for (let i = 0; i < quantity; i++) {
      blogs.push({
        name: `testBlog${i}`,
        description: `test description blog - ${i}`,
        websiteUrl: `https://test.blog-${i}.com`,
      });
    }

    return blogs;
  }

  static generatePostInputDto(
    quantity: number,
    blogId: string,
  ): PostInputDto[] {
    const posts: PostInputDto[] = [];

    for (let i = 0; i < quantity; i++) {
      posts.push({
        title: `testTitle${i}`,
        shortDescription: `test shortDescription post - ${i}`,
        content: `test content post - ${i}`,
        blogId,
      });
    }

    return posts;
  }

  static generateLikeInputDto(
    quantity: number,
    reactionStatus: ReactionStatus,
  ): ReactionInputDto[] {
    const reactions: ReactionInputDto[] = [];

    for (let i = 0; i < quantity; i++) {
      reactions.push({
        likeStatus: ReactionStatus[reactionStatus],
      });
    }

    return reactions;
  }
}
