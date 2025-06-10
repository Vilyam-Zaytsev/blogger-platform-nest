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
import { LikeStatus } from '../../src/modules/bloggers-platform/likes/domain/like.entity';
import { UsersTestManager } from '../managers/users.test-manager';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { HttpStatus } from '@nestjs/common';

describe('PostsController - updateReaction() (PUT: /posts/:postId/like-status)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
  let usersTestManager: UsersTestManager;
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: LikeStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about one like.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUser.id,
          login: createdUser.login,
        },
      ],
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about one like.
    const foundPost_2: PostViewDto = await postsTestManager.getById(
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundPost_2.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: LikeStatus.Like,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUser.id,
          login: createdUser.login,
        },
      ],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №1: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about two like.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 2,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[1].id,
          login: createdUsers[1].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[0].id,
          login: createdUsers[0].login,
        },
      ],
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about two like.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundPost: PostViewDto = await postsTestManager.getById(
        createdPost.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundPost.extendedLikesInfo).toEqual({
        likesCount: 2,
        dislikesCount: 0,
        myStatus: LikeStatus.Like,
        newestLikes: [
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[1].id,
            login: createdUsers[1].login,
          },
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[0].id,
            login: createdUsers[0].login,
          },
        ],
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №2: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about three like.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 3,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[2].id,
          login: createdUsers[2].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[1].id,
          login: createdUsers[1].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[0].id,
          login: createdUsers[0].login,
        },
      ],
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about three like.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundPost: PostViewDto = await postsTestManager.getById(
        createdPost.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundPost.extendedLikesInfo).toEqual({
        likesCount: 3,
        dislikesCount: 0,
        myStatus: LikeStatus.Like,
        newestLikes: [
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[2].id,
            login: createdUsers[2].login,
          },
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[1].id,
            login: createdUsers[1].login,
          },
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[0].id,
            login: createdUsers[0].login,
          },
        ],
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №3: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    //Updating reactions by three users
    //We will update the reaction of the fourth one later to test the update of the newestLikes list.

    for (let i = 0; i < resultLogin.length - 1; i++) {
      await request(server)
        .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(HttpStatus.NO_CONTENT);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about three like.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 3,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[2].id,
          login: createdUsers[2].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[1].id,
          login: createdUsers[1].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[0].id,
          login: createdUsers[0].login,
        },
      ],
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about three like.

    for (let i = 0; i < resultLogin.length - 1; i++) {
      const foundPost: PostViewDto = await postsTestManager.getById(
        createdPost.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundPost.extendedLikesInfo).toEqual({
        likesCount: 3,
        dislikesCount: 0,
        myStatus: LikeStatus.Like,
        newestLikes: [
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[2].id,
            login: createdUsers[2].login,
          },
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[1].id,
            login: createdUsers[1].login,
          },
          {
            addedAt: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            userId: createdUsers[0].id,
            login: createdUsers[0].login,
          },
        ],
      });
    }

    //We update the reaction of the fourth user to test the update of the list of new likes.

    const resUpdateReaction_2: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin[3].authTokens.accessToken}`)
      .send({ likeStatus: LikeStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    const foundPost: PostViewDto = await postsTestManager.getById(
      createdPost.id,
      resultLogin[3].authTokens.accessToken,
    );

    expect(foundPost.extendedLikesInfo).toEqual({
      likesCount: 4,
      dislikesCount: 0,
      myStatus: LikeStatus.Like,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[3].id,
          login: createdUsers[3].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[2].id,
          login: createdUsers[2].login,
        },
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUsers[1].id,
          login: createdUsers[1].login,
        },
      ],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction_2.body,
        resUpdateReaction_2.statusCode,
        'Test №4: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    const resUpdateReaction: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: LikeStatus.Dislike })
      .expect(HttpStatus.NO_CONTENT);

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.
    //The 'newestLikes' field should contain information about one like.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: LikeStatus.None,
      newestLikes: [],
    });

    // The 'myStatus' field must be 'Like' because the user requesting the comment is authenticated.
    //The 'newestLikes' field should contain information about one like.
    const foundPost_2: PostViewDto = await postsTestManager.getById(
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundPost_2.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: LikeStatus.Dislike,
      newestLikes: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction.body,
        resUpdateReaction.statusCode,
        'Test №5: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    const resUpdateReaction: Response[] = [];

    for (let i = 0; i < resultLogin.length; i++) {
      const res: Response = await request(server)
        .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
        .set('Authorization', `Bearer ${resultLogin[i].authTokens.accessToken}`)
        .send({ likeStatus: LikeStatus.Dislike })
        .expect(HttpStatus.NO_CONTENT);

      resUpdateReaction.push(res);
    }

    //The 'myStatus' field must be 'None' because the user requesting the comment is not authenticated.

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 2,
      myStatus: LikeStatus.None,
      newestLikes: [],
    });

    // The 'myStatus' field must be 'Dislike' because the user requesting the comment is authenticated.

    for (let i = 0; i < resultLogin.length; i++) {
      const foundPost: PostViewDto = await postsTestManager.getById(
        createdPost.id,
        resultLogin[i].authTokens.accessToken,
      );

      expect(foundPost.extendedLikesInfo).toEqual({
        likesCount: 0,
        dislikesCount: 2,
        myStatus: LikeStatus.Dislike,
        newestLikes: [],
      });
    }

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction[0].body,
        resUpdateReaction[0].statusCode,
        'Test №6: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
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

    //None to Like

    const resUpdateReaction_1: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: LikeStatus.Like })
      .expect(HttpStatus.NO_CONTENT);

    const foundPost_1: PostViewDto = await postsTestManager.getById(
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundPost_1.extendedLikesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: LikeStatus.Like,
      newestLikes: [
        {
          addedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          userId: createdUser.id,
          login: createdUser.login,
        },
      ],
    });

    // Like to Dislike

    const resUpdateReaction_2: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}/like-status`)
      .set('Authorization', `Bearer ${resultLogin.authTokens.accessToken}`)
      .send({ likeStatus: LikeStatus.Dislike })
      .expect(HttpStatus.NO_CONTENT);

    const foundPost_2: PostViewDto = await postsTestManager.getById(
      createdPost.id,
      resultLogin.authTokens.accessToken,
    );

    expect(foundPost_2.extendedLikesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 1,
      myStatus: LikeStatus.Dislike,
      newestLikes: [],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateReaction_1.body,
        resUpdateReaction_1.statusCode,
        'Test №7: PostsController - updateReaction() (PUT: /posts/:postId/like-status)',
      );
    }
  });
});
