import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { HttpStatus } from '@nestjs/common';
import { ObjectId } from 'mongodb';

describe('BlogsController - deleteBlog() (POST: /blogs)', () => {
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

  it('should delete blog, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.NO_CONTENT);

    const foundBlogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(foundBlogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №1: BlogsController - deleteBlog() (POST: /blogs)',
      );
    }
  });

  it('should not delete blog, the admin is not authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .expect(HttpStatus.UNAUTHORIZED);

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(foundBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №2: BlogsController - deleteBlog() (POST: /blogs)',
      );
    }
  });

  it('should return a 404 error if the blog was not found by the passed ID in the parameters.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const incorrectId: string = new ObjectId().toString();

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${incorrectId}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.NOT_FOUND);

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(foundBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №3: BlogsController - deleteBlog() (POST: /blogs)',
      );
    }
  });
});
