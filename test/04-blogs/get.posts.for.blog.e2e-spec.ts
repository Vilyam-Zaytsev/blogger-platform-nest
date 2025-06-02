import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { HttpStatus } from '@nestjs/common';
import { PostsTestManager } from '../managers/posts.test-manager';
import { Filter } from '../helpers/filter';
import {
  GetPostsQueryParams,
  PostsSortBy,
} from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { ObjectId } from 'mongodb';

describe('BlogsController - getPostsForBlog() (GET: /blogs/{blogId}/posts)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
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
    postsTestManager = new PostsTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should return all posts from a specific blog.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const newPosts: PostViewDto[] = await postsTestManager.createPost(
      3,
      blog.id,
    );

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    const filteredNewPosts: PostViewDto[] = new Filter<PostViewDto>(newPosts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 3,
      items: filteredNewPosts,
    });
    expect(bodyFromGetRequest.items).toHaveLength(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E<PaginatedViewDto<PostViewDto>>(
        bodyFromGetRequest,
        resGetPosts.statusCode,
        'Test №1: BlogsController - getPostsForBlog() (GET: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should return all entries from a specific blog using the pagination values provided by the client.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const newPosts: PostViewDto[] = await postsTestManager.createPost(
      12,
      blog.id,
    );

    const query: GetPostsQueryParams = new GetPostsQueryParams();
    query.sortBy = PostsSortBy.Title;
    query.sortDirection = SortDirection.Ascending;
    query.pageNumber = 2;
    query.pageSize = 3;

    const resGetPosts: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<PostViewDto> =
      resGetPosts.body as PaginatedViewDto<PostViewDto>;

    const filteredNewPosts: PostViewDto[] = new Filter<PostViewDto>(newPosts)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 4,
      page: 2,
      pageSize: 3,
      totalCount: 12,
      items: filteredNewPosts,
    });
    expect(bodyFromGetRequest.items).toHaveLength(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E<PaginatedViewDto<PostViewDto>>(
        bodyFromGetRequest,
        resGetPosts.statusCode,
        'Test №2: BlogsController - getPostsForBlog() (GET: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should return a 404 error if the benefit does not exist.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    await postsTestManager.createPost(12, blog.id);

    const incorrectBlogId: string = new ObjectId().toString();

    const resGetPosts_1: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${incorrectBlogId}/posts`)
      .expect(HttpStatus.NOT_FOUND);

    const resGetPosts_2: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest_2: PaginatedViewDto<PostViewDto> =
      resGetPosts_2.body as PaginatedViewDto<PostViewDto>;

    expect(bodyFromGetRequest_2.items).toHaveLength(10);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetPosts_1.body,
        resGetPosts_1.statusCode,
        'Test №3: BlogsController - getPostsForBlog() (GET: /blogs/{blogId}/posts)',
      );
    }
  });
});
