import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials, TestResultLogin } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { HttpStatus } from '@nestjs/common';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { PostsTestManager } from '../managers/posts.test-manager';
import { UsersTestManager } from '../managers/users.test-manager';
import { CommentsTestManager } from '../managers/comments.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { Filter } from '../helpers/filter';
import { GetCommentsQueryParams } from '../../src/modules/bloggers-platform/comments/api/input-dto/get-comments-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('PostsController - getComments() (GET: /posts/{postId}/comments)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
  let usersTestManager: UsersTestManager;
  let commentsTestManager: CommentsTestManager;
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
    usersTestManager = new UsersTestManager(server, adminCredentialsInBase64);
    commentsTestManager = new CommentsTestManager(server);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    appTestManager.clearThrottlerStorage();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should use default pagination values when none are provided by the client.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const createdComments: CommentViewDto[] =
      await commentsTestManager.createComment(
        12,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );
    const query: GetCommentsQueryParams = new GetCommentsQueryParams();
    const filteredCreatedComments: CommentViewDto[] =
      new Filter<CommentViewDto>(createdComments)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .getResult();

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .expect(HttpStatus.OK);

    expect(resGetComments.body).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 10,
      totalCount: 12,
      items: filteredCreatedComments,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComments.body,
        resGetComments.statusCode,
        'Test №1: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const createdComments: CommentViewDto[] =
      await commentsTestManager.createComment(
        12,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );
    const query: GetCommentsQueryParams = new GetCommentsQueryParams();
    query.pageNumber = 2;
    query.pageSize = 6;
    query.sortDirection = SortDirection.Ascending;
    const filteredCreatedComments: CommentViewDto[] =
      new Filter<CommentViewDto>(createdComments)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .getResult();

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .query(query)
      .expect(HttpStatus.OK);

    expect(resGetComments.body).toEqual({
      pagesCount: 2,
      page: 2,
      pageSize: 6,
      totalCount: 12,
      items: filteredCreatedComments,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComments.body,
        resGetComments.statusCode,
        'Test №2: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });

  it('should return a 400 error if the client has passed invalid pagination values.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    await commentsTestManager.createComment(
      12,
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .query({
        pageNumber: 'xxx',
        pageSize: 'xxx',
        sortBy: 123,
        sortDirection: 'xxx',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resGetComments.body).toEqual({
      errorsMessages: [
        {
          field: 'sortDirection',
          message:
            'sortDirection must be one of the following values: asc, desc; Received value: xxx',
        },
        {
          field: 'pageSize',
          message:
            'pageSize must be a number conforming to the specified constraints; Received value: NaN',
        },
        {
          field: 'pageNumber',
          message:
            'pageNumber must be a number conforming to the specified constraints; Received value: NaN',
        },
        {
          field: 'sortBy',
          message:
            'sortBy must be one of the following values: createdAt; Received value: 123',
        },
      ],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComments.body,
        resGetComments.statusCode,
        'Test №3: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });
});
