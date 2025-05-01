import { CreateBlogDto, UpdateBlogDto } from './dto/createBlogDto';
import { Blog, BlogDocument } from './blog.entity';
import { TestLoggers } from '../../../../test/helpers/test-loggers';

describe('Blog Entity - createInstance()', () => {
  it('should correctly create a Blog instance.', () => {
    const dto: CreateBlogDto = {
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
    const dto: CreateBlogDto = {
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

  it('should throw an error if the blog has already been marked as deleted.', () => {
    const dto: CreateBlogDto = {
      name: 'test_blog',
      description: 'test_description',
      websiteUrl: 'www.test_website_url.com',
    };

    const blog: BlogDocument = Blog.createInstance(dto);

    blog.deletedAt = new Date();

    expect(() => blog.makeDeleted()).toThrow('Entity already deleted');

    TestLoggers.logUnit<BlogDocument>(
      blog,
      'Test №3: Blog Entity - makeDeleted()',
    );
  });

  it('should correctly update blog properties when provided with valid data.', () => {
    const createDto: CreateBlogDto = {
      name: 'test_blog',
      description: 'test_description',
      websiteUrl: 'www.test_website_url.com',
    };

    const updateDto: UpdateBlogDto = {
      name: 'update_test_blog',
      description: 'update_test_description',
      websiteUrl: 'www.update_test_website_url.com',
    };

    const blog: BlogDocument = Blog.createInstance(createDto);

    expect(blog.name).toBe(createDto.name);
    expect(blog.description).toBe(createDto.description);
    expect(blog.websiteUrl).toBe(createDto.websiteUrl);

    blog.update(updateDto);

    expect(blog.name).toBe(updateDto.name);
    expect(blog.description).toBe(updateDto.description);
    expect(blog.websiteUrl).toBe(updateDto.websiteUrl);

    TestLoggers.logUnit<BlogDocument>(blog, 'Test №4: Blog Entity - update()');
  });
});
