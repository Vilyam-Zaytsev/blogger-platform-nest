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
import { HttpStatus } from '@nestjs/common';

describe('BlogsController - createBlog() (POST: /blogs)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminCredentials();
    adminCredentialsInBase64 = TestUtils.encodingAdminDataInBase64(
      adminCredentials.login,
      adminCredentials.password,
    );
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    blogsTestManager = new BlogsTestManager(server, adminCredentialsInBase64);
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
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.CREATED);

    const bodyFromCreateResponse: BlogViewDto =
      resCreateBlog.body as BlogViewDto;

    expect(bodyFromCreateResponse).toEqual({
      id: expect.any(String),
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      createdAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
      isMembership: false,
    });

    const newlyCreatedBlog: BlogViewDto = await blogsTestManager.getById(
      bodyFromCreateResponse.id,
    );

    expect(bodyFromCreateResponse).toEqual(newlyCreatedBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E<BlogViewDto>(
        bodyFromCreateResponse,
        resCreateBlog.statusCode,
        'Test №1: BlogsController - createBlog() (POST: /blogs)',
      );
    }
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
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №2: BlogsController - createBlog() (POST: /blogs)',
      );
    }
  });

  it('should not create a blog if the data in the request body is incorrect (an empty object is passed).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({})
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

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

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №3: BlogsController - createBlog() (POST: /blogs)',
      );
    }
  });

  it('should not create a blog if the data in the request body is incorrect (name: empty line, description: empty line, website Url: empty line).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: '   ',
        description: '   ',
        websiteUrl: '   ',
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

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

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №4: BlogsController - createBlog() (POST: /blogs)',
      );
    }
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
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

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

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №5: BlogsController - createBlog() (POST: /blogs)',
      );
    }
  });

  it('should not create a blog if the data in the request body is incorrect (name: type number, description: type number, website Url: type number).', async () => {
    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send({
        name: 123,
        description: 123,
        websiteUrl: 123,
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

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

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №6: BlogsController - createBlog() (POST: /blogs)',
      );
    }
  });

  it('should not create a blog if the data in the request body is incorrect (invalid url).', async () => {
    const [dto]: BlogInputDto[] = TestDtoFactory.generateBlogInputDto(1);
    dto.websiteUrl = 'incorrect websiteUrl';

    const resCreateBlog: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

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

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateBlog.body,
        resCreateBlog.statusCode,
        'Test №7: BlogsController - createBlog() (POST: /blogs)',
      );
    }
  });
});
