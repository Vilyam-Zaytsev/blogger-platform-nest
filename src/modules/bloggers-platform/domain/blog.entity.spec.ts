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

    const blog: BlogDocument = Blog.createInstance(dto);

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

  it('should set deletedAt to the current date, if not already deleted using the "makeDeleted" method.', () => {
    const dto: CreateBlogDomainDto = {
      name: 'test_blog',
      description: 'test_description',
      websiteUrl: 'www.test_website_url.com',
    };

    const blog: BlogDocument = Blog.createInstance(dto);

    blog.deletedAt = null;

    blog.makeDeleted();

    expect(blog.deletedAt).toBeInstanceOf(Date);

    TestLoggers.logUnit<BlogDocument>(
      blog,
      'Test №2: Blog Entity - makeDeleted()',
    );
  });

  it('should throw an error if the user has already been marked as deleted.', () => {
    const dto: CreateBlogDomainDto = {
      name: 'test_blog',
      description: 'test_description',
      websiteUrl: 'www.test_website_url.com',
    };

    const blog: BlogDocument = Blog.createInstance(dto);

    blog.deletedAt = new Date();

    expect(() => blog.makeDeleted()).toThrow('Entity already deleted');

    TestLoggers.logUnit<BlogDocument>(
      blog,
      'Test №3: User Entity - makeDeleted()',
    );
  });
});
