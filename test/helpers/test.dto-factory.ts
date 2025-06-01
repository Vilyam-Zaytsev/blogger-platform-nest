import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog-input.dto';

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
}
