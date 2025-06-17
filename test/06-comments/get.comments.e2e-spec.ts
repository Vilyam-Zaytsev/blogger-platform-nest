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
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { Filter } from '../helpers/filter';
import { GetCommentsQueryParams } from '../../src/modules/bloggers-platform/comments/api/input-dto/get-comments-query-params.input-dto';
import { ObjectId } from 'mongodb';

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
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should return an empty array.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .expect(HttpStatus.OK);

    expect(resGetComments.body).toEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComments.body,
        resGetComments.statusCode,
        'Test №1: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });

  it('should return an array with a single comment.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<CommentViewDto> =
      resGetComments.body as PaginatedViewDto<CommentViewDto>;

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          id: createdComment.id,
          content: createdComment.content,
          commentatorInfo: {
            userId: createdUser.id,
            userLogin: createdUser.login,
          },
          likesInfo: {
            likesCount: 0,
            dislikesCount: 0,
            myStatus: ReactionStatus.None,
          },
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
        },
      ],
    });

    expect(bodyFromGetResponse.items.length).toEqual(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetComments.statusCode,
        'Test №2: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });

  it('should return an array with three comments.', async () => {
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
        3,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );

    const resGetComments: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<CommentViewDto> =
      resGetComments.body as PaginatedViewDto<CommentViewDto>;

    const query: GetCommentsQueryParams = new GetCommentsQueryParams();
    const filteredCreatedComments: CommentViewDto[] =
      new Filter<CommentViewDto>(createdComments)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .getResult();

    expect(bodyFromGetResponse.items).toEqual(filteredCreatedComments);

    expect(bodyFromGetResponse.items.length).toEqual(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetComments.statusCode,
        'Test №3: PostsController - getComments() (GET: /posts/{postId}/comments)',
      );
    }
  });

  it('should return comment found by id.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );

    const resGetComment: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .expect(HttpStatus.OK);

    expect(resGetComment.body).toEqual(createdComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComment.body,
        resGetComment.statusCode,
        'Test №4: CommentsController - getById() (GET: /comments/:id)',
      );
    }
  });

  it('should return the 404 not found error (if the comment with this ID does not exist).', async () => {
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
      1,
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );
    const incorrectId: string = new ObjectId().toString();

    const resGetComment: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/comments/${incorrectId}`)
      .expect(HttpStatus.NOT_FOUND);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComment.body,
        resGetComment.statusCode,
        'Test №5: CommentsController - getById() (GET: /comments/:id)',
      );
    }
  });

  it('should return the 404 not found error (if the post with this ID does not exist).', async () => {
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
      1,
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );
    const incorrectId: string = new ObjectId().toString();

    const resGetComment: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/posts/${incorrectId}/comments`)
      .expect(HttpStatus.NOT_FOUND);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetComment.body,
        resGetComment.statusCode,
        'Test №6: PostsController - gtComments() (GET: /posts/{postId}comments)',
      );
    }
  });
});
