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
import {
  ExtendedLikesInfo,
  PostViewDto,
} from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { PostsTestManager } from '../managers/posts.test-manager';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { LikeStatus } from '../../src/modules/bloggers-platform/likes/domain/like.entity';
import { ObjectId } from 'mongodb';

describe('PostsController - updatePost() (PUT: /posts)', () => {
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

  it('should update post, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [post]: PostViewDto[] = await postsTestManager.createPost(1, blog.id);
    const dto: PostInputDto = {
      title: 'updateTitle',
      shortDescription: 'update short description',
      content: 'update content',
      blogId: blog.id,
    };

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${post.id}`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NO_CONTENT);

    const updatedPost: PostViewDto = await postsTestManager.getById(post.id);

    expect(post).not.toEqual(updatedPost);

    expect(updatedPost).toEqual({
      id: expect.any(String),
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog.id,
      blogName: blog.name,
      extendedLikesInfo: {
        dislikesCount: 0,
        likesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
      createdAt: expect.any(String),
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №1: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should not update the post if the admin has not been authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );
    const dto: PostInputDto = {
      title: 'updateTitle',
      shortDescription: 'update short description',
      content: 'update content',
      blogId: blog.id,
    };

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}`)
      .send(dto)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №2: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should not update a post if the data in the request body is incorrect (an empty object is passed).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}`)
      .send({})
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdatePost.body).toEqual({
      errorsMessages: [
        {
          field: 'blogId',
          message: 'blogId must be a string; Received value: undefined',
        },
        {
          field: 'content',
          message: 'content must be a string; Received value: undefined',
        },
        {
          field: 'shortDescription',
          message:
            'shortDescription must be a string; Received value: undefined',
        },
        {
          field: 'title',
          message: 'title must be a string; Received value: undefined',
        },
      ],
    });

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №3: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (title: empty line,  short Description: empty line, content: empty line, blogId: empty line).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}`)
      .send({
        title: '   ',
        shortDescription: '   ',
        content: '   ',
        blogId: '   ',
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdatePost.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message:
            'content must be longer than or equal to 1 characters; Received value: ',
        },
        {
          field: 'shortDescription',
          message:
            'shortDescription must be longer than or equal to 1 characters; Received value: ',
        },
        {
          field: 'title',
          message:
            'title must be longer than or equal to 1 characters; Received value: ',
        },
      ],
    });

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №4: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (title: exceeds max length, shortDescription: exceeds max length, content: exceeds max length, blogId: incorrect).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );
    const title: string = TestUtils.generateRandomString(31);
    const shortDescription: string = TestUtils.generateRandomString(101);
    const content: string = TestUtils.generateRandomString(1001);
    const blogId: string = TestUtils.generateRandomString(10);

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}`)
      .send({
        title,
        shortDescription,
        content,
        blogId,
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdatePost.body).toEqual({
      errorsMessages: [
        {
          field: 'content',
          message: `content must be shorter than or equal to 1000 characters; Received value: ${content}`,
        },
        {
          field: 'shortDescription',
          message: `shortDescription must be shorter than or equal to 100 characters; Received value: ${shortDescription}`,
        },
        {
          field: 'title',
          message: `title must be shorter than or equal to 30 characters; Received value: ${title}`,
        },
      ],
    });

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №5: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (title: type number, shortDescription: type number, content: type number, blogId: incorrect).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${createdPost.id}`)
      .send({
        title: 123,
        shortDescription: 123,
        content: 123,
        blogId: 123,
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdatePost.body).toEqual({
      errorsMessages: [
        {
          field: 'blogId',
          message: `blogId must be a string; Received value: 123`,
        },
        {
          field: 'content',
          message: `content must be a string; Received value: 123`,
        },
        {
          field: 'shortDescription',
          message: `shortDescription must be a string; Received value: 123`,
        },
        {
          field: 'title',
          message: `title must be a string; Received value: 123`,
        },
      ],
    });

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №6: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });

  it('should return a 404 error if the post does not exist.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);
    const [createdPost]: PostViewDto[] = await postsTestManager.createPost(
      1,
      blog.id,
    );
    const dto: PostInputDto = {
      title: 'updateTitle',
      shortDescription: 'update short description',
      content: 'update content',
      blogId: blog.id,
    };
    const incorrectId: string = new ObjectId().toString();

    const resUpdatePost: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/posts/${incorrectId}`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NOT_FOUND);

    const post: PostViewDto = await postsTestManager.getById(createdPost.id);

    expect(createdPost).toEqual(post);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdatePost.body,
        resUpdatePost.statusCode,
        'Test №7: PostsController - updatePost() (PUT: /posts)',
      );
    }
  });
});
