import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { TestDtoFactory } from '../helpers/test.dto-factory';
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
import { CommentInputDto } from '../../src/modules/bloggers-platform/comments/api/input-dto/comment-input.dto';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';
import { CommentsTestManager } from '../managers/comments.test-manager';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';

describe('PostsController - createComment() (POST: /posts/{postId}/comments)', () => {
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

  it('should not create a new comment if the user is not logged in.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const [dto]: CommentInputDto[] = TestDtoFactory.generateCommentInputDto(1);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send(dto)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.CREATED);

    const bodyFromCreateResponse: CommentViewDto =
      resCreateComment.body as CommentViewDto;

    expect(bodyFromCreateResponse).toEqual({
      id: expect.any(String),
      content: dto.content,
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

    const newlyCreatedComment: CommentViewDto =
      await commentsTestManager.getById(bodyFromCreateResponse.id);

    expect(bodyFromCreateResponse).toEqual(newlyCreatedComment);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromCreateResponse,
        resCreateComment.statusCode,
        'Test №1: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it('should return a 401 error if the user is not logged in (sending an invalid access token)', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const [dto]: CommentInputDto[] = TestDtoFactory.generateCommentInputDto(1);

    await TestUtils.delay(3000);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send(dto)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.UNAUTHORIZED);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №2: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it("should not create a new comment If post with specified postId doesn't exists.", async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const [dto]: CommentInputDto[] = TestDtoFactory.generateCommentInputDto(1);
    const incorrectId: string = new ObjectId().toString();

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${incorrectId}/comments`)
      .send(dto)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №3: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it('should not create a commentary if the data in the request body is incorrect (an empty object is passed).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send({})
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: 'content must be a string; Received value: undefined',
        },
      ],
    });

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №4: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it('should not create a commentary if the data in the request body is incorrect (the content field contains data of the number type).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send({ content: 123 })
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: 'content must be a string; Received value: 123',
        },
      ],
    });

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №5: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it('should not create a commentary if the data in the request body is incorrect (the content field is less than 20 characters long).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const content: string = TestUtils.generateRandomString(19);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send({ content })
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be longer than or equal to 20 characters; Received value: ${content}`,
        },
      ],
    });

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №6: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });

  it('should not create a commentary if the data in the request body is incorrect (the content field is more than 300 characters long).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const content: string = TestUtils.generateRandomString(301);

    const resCreateComment: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/comments`)
      .send({ content })
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreateComment.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be shorter than or equal to 300 characters; Received value: ${content}`,
        },
      ],
    });

    const comments: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    expect(comments.items.length).toEqual(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreateComment.body,
        resCreateComment.statusCode,
        'Test №7: PostsController - createComment() (POST: /posts/{postId}/comments)',
      );
    }
  });
});
