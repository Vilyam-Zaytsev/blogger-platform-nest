import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { Blog, BlogDocument } from './blog.entity';
import { TestLoggers } from '../../../../test/helpers/test-loggers';

describe('Blog Entity - createInstance()', () => {
  it('should correctly create a Blog instance.', () => {
    const dto: CreateBlogDomainDto = {
      name: 'test_blog',
      description: 'test_description',
      websiteUrl: 'www.test_website_url.com',
    };

    const blog = Blog.createInstance(dto);

    expect(blog.name).toBe(dto.name);
    expect(blog.description).toBe(dto.description);
    expect(blog.websiteUrl).toBe(dto.websiteUrl);

    expect(blog).toHaveProperty('createdAt');
    expect(blog).toHaveProperty('updatedAt');
    expect(blog).toHaveProperty('deletedAt');

    TestLoggers.logUnit<BlogDocument>(
      blog,
      'Test №1: Blog Entity - createInstance()',
    );
  });
});
