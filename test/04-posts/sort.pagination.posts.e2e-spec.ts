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
import { Filter } from '../helpers/filter';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('PostsController - getPost() (GET: /posts (pagination, sort, search in term))', () => {
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

  it('should use default pagination values when none are provided by the client.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(12, blog.id);

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    const filteredCreatedPosts: PostViewDto[] = new Filter<PostViewDto>(posts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 10,
      totalCount: 12,
      items: filteredCreatedPosts,
    });
    expect(bodyFromGetResponse.items).toHaveLength(10);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetPosts.statusCode,
        'Test №1: PostsController - getPost() (GET: /posts (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(1).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(12, blog.id);

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    query.sortBy = PostsSortBy.Title;
    query.sortDirection = SortDirection.Ascending;
    query.pageNumber = 2;
    query.pageSize = 3;

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const filteredCreatedPosts: PostViewDto[] = new Filter<PostViewDto>(posts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 4,
      page: 2,
      pageSize: 3,
      totalCount: 12,
      items: filteredCreatedPosts,
    });
    expect(bodyFromGetResponse.items).toHaveLength(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetPosts.statusCode,
        'Test №2: PostsController - getPost() (GET: /posts (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(2).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(12, blog.id);

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    query.sortBy = PostsSortBy.CreatedAt;
    query.sortDirection = SortDirection.Descending;
    query.pageNumber = 6;
    query.pageSize = 2;

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const filteredCreatedPosts: PostViewDto[] = new Filter<PostViewDto>(posts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 6,
      page: 6,
      pageSize: 2,
      totalCount: 12,
      items: filteredCreatedPosts,
    });
    expect(bodyFromGetResponse.items).toHaveLength(2);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetPosts.statusCode,
        'Test №3: PostsController - getPost() (GET: /posts (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(3).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const posts: PostViewDto[] = await postsTestManager.createPost(12, blog.id);

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    query.sortBy = PostsSortBy.Title;
    query.sortDirection = SortDirection.Descending;
    query.pageNumber = 2;
    query.pageSize = 1;

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const filteredCreatedPosts: PostViewDto[] = new Filter<PostViewDto>(posts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 12,
      page: 2,
      pageSize: 1,
      totalCount: 12,
      items: filteredCreatedPosts,
    });
    expect(bodyFromGetResponse.items).toHaveLength(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetPosts.statusCode,
        'Test №4: PostsController - getPost() (GET: /posts (pagination, sort, search in term))',
      );
    }
  });
});
