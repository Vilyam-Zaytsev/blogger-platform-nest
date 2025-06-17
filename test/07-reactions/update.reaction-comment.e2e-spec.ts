import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials, TestResultLogin } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { PostsTestManager } from '../managers/posts.test-manager';
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { UsersTestManager } from '../managers/users.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { HttpStatus } from '@nestjs/common';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { Filter } from '../helpers/filter';
import { GetPostsQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-posts-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { ObjectId } from 'mongodb';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constans/auth-tokens.inject-constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { CommentsTestManager } from '../managers/comments.test-manager';
import { CommentViewDto } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment-view.dto';

describe('CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
  let commentsTestManager: CommentsTestManager;
  let usersTestManager: UsersTestManager;
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
              signOptions: { expiresIn: '3s' },
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
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should update the user\'s "like" reaction and increase the number of similar reactions(№1).', async () => {
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about one like.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about one like.
    const foundComment_2: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_2.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: ReactionStatus.Like,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №1: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update the user\'s "like" reaction and increase the number of similar reactions(№2).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(2);
    const resultLogin: TestResultLogin[] = await usersTestManager.login(
      createdUsers.map((u) => u.login),
    );
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin[0].authTokens.accessToken,
      );

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: ReactionStatus.Like })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about two like.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about two like.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundComment: CommentViewDto = await commentsTestManager.getById(
        createdComment.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundComment.likesInfo).toEqual({
        likesCount: 2,
        dislikesCount: 0,
        myStatus: ReactionStatus.Like,
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №2: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update the user\'s "like" reaction and increase the number of similar reactions(№3).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(3);
    const resultLogin: TestResultLogin[] = await usersTestManager.login(
      createdUsers.map((u) => u.login),
    );
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin[0].authTokens.accessToken,
      );

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: ReactionStatus.Like })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about three like.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 3,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about three like.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundComment: CommentViewDto = await commentsTestManager.getById(
        createdComment.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundComment.likesInfo).toEqual({
        likesCount: 3,
        dislikesCount: 0,
        myStatus: ReactionStatus.Like,
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №3: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update the user\'s "like" reaction and increase the number of similar reactions(№4).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(4);
    const resultLogin: TestResultLogin[] = await usersTestManager.login(
      createdUsers.map((u) => u.login),
    );
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin[0].authTokens.accessToken,
      );

    //Updating reactions by three users
    //We will update the reaction of the fourth one later to test the update of the newestLikes list.

    for (let i = 0; i < resultLogin.length - 1; i++) {
      await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: ReactionStatus.Like })
        .expect(HttpStatus.NO_CONTENT);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about three like.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 3,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about three like.

    for (let i = 0; i < resultLogin.length - 1; i++) {
      const foundComment: CommentViewDto = await commentsTestManager.getById(
        createdComment.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundComment.likesInfo).toEqual({
        likesCount: 3,
        dislikesCount: 0,
        myStatus: ReactionStatus.Like,
      });
    }

    //We update the reaction of the fourth user to test the update of the list of new likes.

    const resUpdateReaction_2: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin[3].authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    const foundComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin[3].authTokens.accessToken,
    );

    expect(foundComment.likesInfo).toEqual({
      likesCount: 4,
      dislikesCount: 0,
      myStatus: ReactionStatus.Like,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction_2.body,
        resUpdateReaction_2.statusCode,
        'Test №4: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update the user\'s "dislike" reaction and increase the number of similar reactions(№1).', async () => {
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Dislike })
      .expect(HttpStatus.NO_CONTENT);

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about one like.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about one like.
    const foundComment_2: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_2.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: ReactionStatus.Dislike,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №5: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update the user\'s "dislike" reaction and increase the number of similar reactions(№2).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(2);
    const resultLogin: TestResultLogin[] = await usersTestManager.login(
      createdUsers.map((u) => u.login),
    );
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin[0].authTokens.accessToken,
      );

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: ReactionStatus.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 2,
      myStatus: ReactionStatus.None,
    });

    // The 'myStatus' field must be 'Dislike' because the user requesting the comment is authenticated.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundComment: CommentViewDto = await commentsTestManager.getById(
        createdComment.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundComment.likesInfo).toEqual({
        likesCount: 0,
        dislikesCount: 2,
        myStatus: ReactionStatus.Dislike,
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №6: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should update "None" to "Like", "Like" to "Dislike", "Dislike to "Like", "Like" to "None".', async () => {
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

    //None to Like

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: ReactionStatus.Like,
    });

    // Like to Dislike

    await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Dislike })
      .expect(HttpStatus.NO_CONTENT);

    const foundComment_2: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_2.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: ReactionStatus.Dislike,
    });

    // Dislike to Like

    await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    const foundComment_3: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_3.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: ReactionStatus.Like,
    });

    //Like to None

    await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.None })
      .expect(HttpStatus.NO_CONTENT);

    const foundComment_4: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundComment_4.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №7: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('1. The first five posts: user 1 - puts likes; user 2 - puts dislikes. 2. The following five posts: user 1 - dislikes; user 2 - likes.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const [createUser1, createUser2]: UserViewDto[] =
      await usersTestManager.createUser(2);
    const resultLogins: TestResultLogin[] = await usersTestManager.login([
      createUser1.login,
      createUser2.login,
    ]);
    const createdComments: CommentViewDto[] =
      await commentsTestManager.createComment(
        10,
        createdPost.id,
        resultLogins[0].authTokens.accessToken,
      );

    //1. The first five posts: user 1 - puts likes; user 2 - puts dislikes.
    //2. The following five posts: user 1 - dislikes; user 2 - likes.

    for (let i = 0; i < createdComments.length; i++) {
      if (createdComments.length / 2 > i) {
        // user 1 - puts likes;
        await request(server)
          .put(
            `/${GLOBAL_PREFIX}/comments/${createdComments[i].id}/like-status`,
          )
          .set(
            'Authorization',
            `Bearer ${resultLogins[0].authTokens.accessToken}`,
          )
          .send({ likeStatus: ReactionStatus.Like })
          .expect(HttpStatus.NO_CONTENT);

        // user 2 - puts dislikes
        await request(server)
          .put(
            `/${GLOBAL_PREFIX}/comments/${createdComments[i].id}/like-status`,
          )
          .set(
            'Authorization',
            `Bearer ${resultLogins[1].authTokens.accessToken}`,
          )
          .send({ likeStatus: ReactionStatus.Dislike })
          .expect(HttpStatus.NO_CONTENT);
      } else {
        // user 1 - puts dislikes;
        await request(server)
          .put(
            `/${GLOBAL_PREFIX}/comments/${createdComments[i].id}/like-status`,
          )
          .set(
            'Authorization',
            `Bearer ${resultLogins[0].authTokens.accessToken}`,
          )
          .send({ likeStatus: ReactionStatus.Dislike })
          .expect(HttpStatus.NO_CONTENT);

        // user 2 - puts likes
        await request(server)
          .put(
            `/${GLOBAL_PREFIX}/comments/${createdComments[i].id}/like-status`,
          )
          .set(
            'Authorization',
            `Bearer ${resultLogins[1].authTokens.accessToken}`,
          )
          .send({ likeStatus: ReactionStatus.Like })
          .expect(HttpStatus.NO_CONTENT);
      }
    }

    const foundComments_1: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll(
        {},
        createdPost.id,
        resultLogins[0].authTokens.accessToken,
      );

    //sorting the found posts in ascending order
    const query: GetPostsQueryParams = new GetPostsQueryParams();
    query.sortDirection = SortDirection.Ascending;
    const sortedComments: CommentViewDto[] = new Filter<CommentViewDto>(
      foundComments_1.items,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    //checking it out:
    //1. The first five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.Like
    //2. The following five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.Dislike
    for (let i = 0; i < sortedComments.length; i++) {
      if (sortedComments.length / 2 > i) {
        expect(sortedComments[i].likesInfo).toEqual({
          likesCount: 1,
          dislikesCount: 1,
          myStatus: ReactionStatus.Like,
        });
      }
    }

    const foundComments_2: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll(
        {},
        createdPost.id,
        resultLogins[1].authTokens.accessToken,
      );

    //sorting the found posts in ascending order
    query.sortDirection = SortDirection.Ascending;
    const sortedComments_2: CommentViewDto[] = new Filter<CommentViewDto>(
      foundComments_2.items,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    //checking it out:
    //1. The first five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.Dislike
    //2. The following five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.Like
    for (let i = 0; i < sortedComments_2.length; i++) {
      if (sortedComments_2.length / 2 > i) {
        expect(sortedComments_2[i].likesInfo).toEqual({
          likesCount: 1,
          dislikesCount: 1,
          myStatus: ReactionStatus.Dislike,
        });
      } else {
        expect(sortedComments_2[i].likesInfo).toEqual({
          likesCount: 1,
          dislikesCount: 1,
          myStatus: ReactionStatus.Like,
        });
      }
    }

    const foundComments_3: PaginatedViewDto<CommentViewDto> =
      await commentsTestManager.getAll({}, createdPost.id);

    //sorting the found posts in ascending order
    query.sortDirection = SortDirection.Ascending;
    const sortedComments_3: CommentViewDto[] = new Filter<CommentViewDto>(
      foundComments_3.items,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .getResult();

    //checking it out:
    //1. The first five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.None
    //2. The following five posts: likesCount: 1, dislikesCount: 1, myStatus: ReactionStatus.None
    for (let i = 0; i < sortedComments_3.length; i++) {
      if (sortedComments_3.length / 2 > i) {
        expect(sortedComments_3[i].likesInfo).toEqual({
          likesCount: 1,
          dislikesCount: 1,
          myStatus: ReactionStatus.None,
        });
      } else {
        expect(sortedComments_3[i].likesInfo).toEqual({
          likesCount: 1,
          dislikesCount: 1,
          myStatus: ReactionStatus.None,
        });
      }
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        {},
        HttpStatus.NO_CONTENT,
        'Test №8: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('1. must create ten users. 2. All ten users like one post. 3.Then each user changes the like to dislike reaction. newestLikes should change along with this.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      createdBlog.id,
    );
    const createdUsers: UserViewDto[] = await usersTestManager.createUser(10);
    const resultLogins: TestResultLogin[] = await usersTestManager.login(
      createdUsers.map((user) => user.login),
    );
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogins[0].authTokens.accessToken,
      );

    //All ten users like one post.
    for (let i = 0; i < resultLogins.length; i++) {
      await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set(
          'Authorization',
          `Bearer ${resultLogins[i].authTokens.accessToken}`,
        )
        .send({ likeStatus: ReactionStatus.Like })
        .expect(HttpStatus.NO_CONTENT);
    }

    const foundComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment.likesInfo).toEqual({
      likesCount: 10,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    for (let i = resultLogins.length - 1; i >= 0; i--) {
      await request(server)
        .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
        .set(
          'Authorization',
          `Bearer ${resultLogins[i].authTokens.accessToken}`,
        )
        .send({ likeStatus: ReactionStatus.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      const foundComment: CommentViewDto = await commentsTestManager.getById(
        createdComment.id,
        resultLogins[i].authTokens.accessToken,
      );

      const dislikesCount: number = resultLogins.length - i;

      expect(foundComment.likesInfo).toEqual({
        likesCount: 10 - dislikesCount,
        dislikesCount,
        myStatus: ReactionStatus.Dislike,
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        {},
        HttpStatus.NO_CONTENT,
        'Test №9: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should return a 401 if the user is not logged in.', async () => {
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer incorrect token`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.UNAUTHORIZED);

    const foundComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №10: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should return the value 404 if the post the user is trying to review does not exist.', async () => {
    const [createdUser]: UserViewDto[] = await usersTestManager.createUser(1);
    const [resultLogin]: TestResultLogin[] = await usersTestManager.login([
      createdUser.login,
    ]);
    const incorrectId: string = new ObjectId().toString();

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${incorrectId}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.NOT_FOUND);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №11: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should return 400 if the input data is not valid (an empty object is passed).', async () => {
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateReaction.body).toEqual({
      errorsMessages: [
        {
          field: 'likeStatus',
          message:
            'likeStatus must be one of the following values: None, Like, Dislike; Received value: undefined',
        },
      ],
    });

    const foundComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №12: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });

  it('should return 400 if the input data is not valid (likeStatus differs from other values).', async () => {
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: 'Likes' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateReaction.body).toEqual({
      errorsMessages: [
        {
          field: 'likeStatus',
          message:
            'likeStatus must be one of the following values: None, Like, Dislike; Received value: Likes',
        },
      ],
    });

    const foundComment: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №13: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
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
    const [createdComment]: CommentViewDto[] =
      await commentsTestManager.createComment(
        1,
        createdPost.id,
        resultLogin.authTokens.accessToken,
      );

    await TestUtils.delay(3000);

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/comments/${createdComment.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: ReactionStatus.Like })
      .expect(HttpStatus.UNAUTHORIZED);

    const foundComment_1: CommentViewDto = await commentsTestManager.getById(
      createdComment.id,
    );

    expect(foundComment_1.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: ReactionStatus.None,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №14: CommentsController - updateReaction() (PUT: /comments/:commentId/like-status)',
      );
    }
  });
});
