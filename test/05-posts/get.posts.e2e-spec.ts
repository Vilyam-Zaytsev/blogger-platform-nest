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
import { GetBlogsQueryParams } from '../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { Filter } from '../helpers/filter';

describe('PostsController - getPost() (GET: /posts)', () => {
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

  it('should return an empty array.', async () => {
    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    expect(resGetPosts.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPosts.body,
        resGetPosts.statusCode,
        'Test №1: PostsController - getPost() (GET: /posts)',
      );
    }
  });

  it('should return an array with a single post.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(1, blog.id);

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: posts,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPosts.body,
        resGetPosts.statusCode,
        'Test №2: PostsController - getPost() (GET: /posts)',
      );
    }
  });

  it('should return an array with a three posts.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(3, blog.id);

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    const filteredCreatedPosts: PostViewDto[] = new Filter<PostViewDto>(posts)
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    expect(bodyFromGetResponse.items).toEqual(filteredCreatedPosts);
    expect(bodyFromGetResponse.items.length).toEqual(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPosts.body,
        resGetPosts.statusCode,
        'Test №3: PostsController - getPost() (GET: /posts)',
      );
    }
  });

  it('should return post found by id.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);

    const resGetPost: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${post.id}`)
      .expect(HttpStatus.OK);

    expect(resGetPost.body).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPost.body,
        resGetPost.statusCode,
        'Test №4: PostsController - getPost() (GET: /posts)',
      );
    }
  });

  it('should return error 404 not found.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);
    const incorrectId: string = new ObjectId().toString();

    const resGetPost_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${incorrectId}`)
      .expect(HttpStatus.NOT_FOUND);

    const resGetPost_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${post.id}`)
      .expect(HttpStatus.OK);

    expect(resGetPost_2.body).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPost_1.body,
        resGetPost_1.statusCode,
        'Test №5: PostsController - getPost() (GET: /posts)',
      );
    }
  });
});
