import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog-input.dto';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';

describe('BlogsController - createBlog() (POST: /blogs)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    blogsTestManager = new BlogsTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should create a new blog, the admin is authenticated.', async () => {
    const [dto]: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(1);

    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: dto.name,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(201);

    const blog: BlogViewDto = resCreateBlog.body as BlogViewDto;

    expect(typeof blog.id).toBe('string');
    expect(new Date(blog.createdAt).toString()).not.toBe('Invalid Date');
    expect(blog.name).toBe(dto.name);
    expect(blog.description).toBe(dto.description);
    expect(blog.websiteUrl).toBe(dto.websiteUrl);
    expect(typeof blog.isMembership).toBe('boolean');

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    TestLoggers.logE2E<BlogViewDto>(
      blog,
      resCreateBlog.statusCode,
      'Test №1: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the admin is not authenticated.', async () => {
    const [dto]: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(1);

    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: dto.name,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .expect(401);

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №2: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the data in the request body is incorrect (an empty object is passed).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({})
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/ regular expression; Received value: undefined',
        },
        {
          field: 'description',
          message: 'description must be a string; Received value: undefined',
        },
        {
          field: 'name',
          message: 'name must be a string; Received value: undefined',
        },
      ],
    });

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №3: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the data in the request body is incorrect (name: empty line, description: empty line, website Url: empty line).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: '   ',
        description: '   ',
        websiteUrl: '   ',
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/ regular expression; Received value: ',
        },
        {
          field: 'description',
          message:
            'description must be longer than or equal to 1 characters; Received value: ',
        },
        {
          field: 'name',
          message:
            'name must be longer than or equal to 1 characters; Received value: ',
        },
      ],
    });

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №4: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the data in the request body is incorrect (name: exceeds max length, description: exceeds max length, website Url: exceeds max length).', async () => {
    const name: string = TestUtils.generateRandomString(16);
    const description: string = TestUtils.generateRandomString(501);
    const websiteUrl: string = TestUtils.generateRandomString(101);

    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name,
        description,
        websiteUrl,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: ${websiteUrl}`,
        },
        {
          field: 'description',
          message: `description must be shorter than or equal to 500 characters; Received value: ${description}`,
        },
        {
          field: 'name',
          message: `name must be shorter than or equal to 15 characters; Received value: ${name}`,
        },
      ],
    });

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №5: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the data in the request body is incorrect (name: type number, description: type number, website Url: type number).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: 123,
        description: 123,
        websiteUrl: 123,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: 123`,
        },
        {
          field: 'description',
          message: `description must be a string; Received value: 123`,
        },
        {
          field: 'name',
          message: `name must be a string; Received value: 123`,
        },
      ],
    });

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №6: BlogsController - createBlog() (POST: /blogs)',
    );
  });

  it('should not create a blog if the data in the request body is incorrect (invalid url).', async () => {
    const [dto]: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(1);
    dto.websiteUrl = 'incorrect websiteUrl';

    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: dto.name,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(400);

    expect(resCreateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: ${dto.websiteUrl}`,
        },
      ],
    });

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    TestLoggers.logE2E(
      resCreateBlog.body,
      resCreateBlog.statusCode,
      'Test №7: BlogsController - createBlog() (POST: /blogs)',
    );
  });
});
