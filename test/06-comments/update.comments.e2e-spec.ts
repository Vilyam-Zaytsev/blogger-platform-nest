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
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { PostsTestManager } from '../managers/posts.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { UsersTestManager } from '../managers/users.test-manager';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { CommentsTestManager } from '../managers/comments.test-manager';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';

describe('CommentsController - updateComment() (PUT: /comments/:id)', () => {
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

  it('should update the comment if the user is logged in.', async () => {
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

    const newContent: string = 'update content comment';

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({
        content: newContent,
      })
      .expect(HttpStatus.NO_CONTENT);

    const updatedComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(updatedComment).toEqual({
      id: createdComment.id,
      content: newContent,
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
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №1: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update the comment if the user is not logged in.', async () => {
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

    const newContent: string = 'update content comment';

    await TestUtils.delay(3000);

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({
        content: newContent,
      })
      .expect(HttpStatus.UNAUTHORIZED);

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №2: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update the comment if the data in the request body is incorrect (an empty object is passed).', async () => {
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

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: 'content must be a string; Received value: undefined',
        },
      ],
    });

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №3: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update the comment if the data in the request body is incorrect (the content field contains data of the number type).', async () => {
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

    const content: string = '123';

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ content })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be longer than or equal to 20 characters; Received value: ${content}`,
        },
      ],
    });

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №4: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update the comment if the data in the request body is incorrect (the content field is less than 20 characters long).', async () => {
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

    const content: string = TestUtils.generateRandomString(19);

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ content })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be longer than or equal to 20 characters; Received value: ${content}`,
        },
      ],
    });

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №5: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update the comment if the data in the request body is incorrect (the content field is more than 300 characters long).', async () => {
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

    const content: string = TestUtils.generateRandomString(301);

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ content })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be shorter than or equal to 300 characters; Received value: ${content}`,
        },
      ],
    });

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №6: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update comments if the user in question is not the owner of the comment.', async () => {
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

    const newContent: string = 'update content comment';

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}`)
      .set('Authorization', `Bearer ${resultLogin_2.authTokens.accessToken}`)
      .send({ content: newContent })
      .expect(HttpStatus.FORBIDDEN);

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №7: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });

  it('should not update comments if the comment does not exist.', async () => {
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
    const newContent: string = 'update content comment';
    const incorrectId: string = new ObjectId().toString();

    const resUpdateComment: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${incorrectId}`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ content: newContent })
      .expect(HttpStatus.NOT_FOUND);

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(createdComment.id);

    expect(createdComment).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateComment.body,
        resUpdateComment.statusCode,
        'Test №8: CommentsController - updateComment() (PUT: /comments/:id)',
      );
    }
  });
});
