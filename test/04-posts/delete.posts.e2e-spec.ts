import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { HttpStatus } from '@nestjs/common';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { PostsTestManager } from '../managers/posts.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { ObjectId } from 'mongodb';

describe('PostsController - deletePost() (DELETE: /posts)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
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
    postsTestManager = new PostsTestManager(server, adminCredentialsInBase64);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should delete post, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);

    const resDeletePost: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/posts/${post.id}`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NO_CONTENT);

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeletePost.body,
        resDeletePost.statusCode,
        'Test №1: PostsController - deletePost() (DELETE: /posts)',
      );
    }
  });

  it('should not delete blog, the admin is not authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);

    const resDeletePost: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/posts/${post.id}`)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const posts: PostViewDto = await postsTestManager.getById(post.id);

    expect(posts).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeletePost.body,
        resDeletePost.statusCode,
        'Test №2: PostsController - deletePost() (DELETE: /posts)',
      );
    }
  });

  it('should return a 404 error if the blog was not found by the passed ID in the parameters.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);
    const incorrectId: string = new ObjectId().toString();

    const resDeletePost: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/posts/${incorrectId}`)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NOT_FOUND);

    const posts: PostViewDto = await postsTestManager.getById(post.id);

    expect(posts).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeletePost.body,
        resDeletePost.statusCode,
        'Test №3: PostsController - deletePost() (DELETE: /posts)',
      );
    }
  });
});
