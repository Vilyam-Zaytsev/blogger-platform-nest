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

describe('BlogsController - deleteBlog() (DELETE: /blogs)', () => {
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

  it('should delete blog, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NO_CONTENT);

    const blogs: PaginatedViewDto<BlogViewDto> =
      await blogsTestManager.getAll();

    expect(blogs.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №1: BlogsController - deleteBlog() (DELETE: /blogs)',
      );
    }
  });

  it('should not delete blog, the admin is not authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const blogs: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blogs).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №2: BlogsController - deleteBlog() (DELETE: /blogs)',
      );
    }
  });

  it('should return a 404 error if the blog was not found by the passed ID in the parameters.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const incorrectId: string = new ObjectId().toString();

    const resDeleteBlog: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/blogs/${incorrectId}`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NOT_FOUND);

    const blogs: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blogs).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteBlog.body,
        resDeleteBlog.statusCode,
        'Test №3: BlogsController - deleteBlog() (DELETE: /blogs)',
      );
    }
  });
});
