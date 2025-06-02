import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { HttpStatus } from '@nestjs/common';
import { Filter } from '../helpers/filter';
import { GetBlogsQueryParams } from '../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { ObjectId } from 'mongodb';

describe('BlogsController - getBlog() (GET: /blogs)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let adminCredentials: AdminCredentials;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    blogsTestManager = new BlogsTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should return an empty array.', async () => {
    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    expect(resGetBlogs.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №1: BlogsController - getBlog() (GET: /blogs)',
      );
    }
  });

  it('should return an array with a single blog.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [blog],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №2: BlogsController - getBlog() (GET: /blogs)',
      );
    }
  });

  it('should return an array with a three blogs.', async () => {
    const createdBlogs: BlogViewDto[] = await blogsTestManager.createBlog(3);

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    const filteredNewBlogs: BlogViewDto[] = new Filter<BlogViewDto>(
      createdBlogs,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetRequest.items).toEqual(filteredNewBlogs);
    expect(bodyFromGetRequest.items.length).toEqual(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №3: BlogsController - getBlog() (GET: /blogs)',
      );
    }
  });

  it('should return blog found by id.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resGetBlog: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .expect(HttpStatus.OK);

    expect(resGetBlog.body).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlog.body,
        resGetBlog.statusCode,
        'Test №4: BlogsController - getBlog() (GET: /blogs)',
      );
    }
  });

  it('should return error 404 not found.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const incorrectId: string = new ObjectId().toString();

    const resGetBlog_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${incorrectId}`)
      .expect(HttpStatus.NOT_FOUND);

    const resGetBlog_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .expect(HttpStatus.OK);

    expect(blog).toEqual(resGetBlog_2.body);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlog_1.body,
        resGetBlog_1.statusCode,
        'Test №5: BlogsController - getBlog() (GET: /blogs)',
      );
    }
  });
});
