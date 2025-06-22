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
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { UsersTestManager } from '../managers/users.test-manager';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { CommentsTestManager } from '../managers/comments.test-manager';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';

describe('CommentsController - deleteComment() (DELETE: /comments/:id)', () => {
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
    await appTestManager.init((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.accessTokenSecret,
              signOptions: { expiresIn: '2s' },
            });
          },
          inject: [UserAccountsConfig],
        }),
    );

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

  it('should delete the comment if the user is logged in.', async () => {
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

    const resDeleteComment: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.NO_CONTENT);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteComment.body,
        resDeleteComment.statusCode,
        'Test №1: CommentsController - deleteComment() (DELETE: /comments/:id)',
      );
    }
  });

  it('should not delete the comment if the user is not logged in.', async () => {
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

    await TestUtils.delay(3000);

    const resDeleteComment: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.UNAUTHORIZED);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(1);
    expect(comments.items[0]).toEqual(createdComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteComment.body,
        resDeleteComment.statusCode,
        'Test №2: CommentsController - deleteComment() (DELETE: /comments/:id)',
      );
    }
  });

  it('should not delete comments if the user in question is not the owner of the comment.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser_1, createdUser_2]: UserViewDto[] =
      await usersTestManager.createUser(2);
    const [resultLogin_1, resultLogin_2]: TestResultLogin[] =
      await usersTestManager.login([createdUser_1.login, createdUser_2.login]);
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin_1.authTokens.accessToken,
      );

    const resDeleteComment: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin_2.authTokens.accessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(1);
    expect(comments.items[0]).toEqual(createdComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteComment.body,
        resDeleteComment.statusCode,
        'Test №3: CommentsController - deleteComment() (DELETE: /comments/:id)',
      );
    }
  });

  it('should not delete comments if the comment does not exist.', async () => {
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
    const incorrectId: string = new ObjectId().toString();

    const resDeleteComment: Response = await request(server)
      .delete(`/${GLOBAL_PREFIX}/comments/${incorrectId}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(1);
    expect(comments.items[0]).toEqual(createdComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resDeleteComment.body,
        resDeleteComment.statusCode,
        'Test №4: CommentsController - deleteComment() (DELETE: /comments/:id)',
      );
    }
  });
});
