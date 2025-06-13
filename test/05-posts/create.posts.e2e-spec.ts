import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { HttpStatus } from '@nestjs/common';
import { PostViewDto } from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { ReactionStatus } from '../../src/modules/bloggers-platform/reactions/domain/reaction.entity';
import { PostsTestManager } from '../managers/posts.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';

describe('PostsController - createPost() (POST: /posts)', () => {
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

  it('should create a new post, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const [dto]: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      1,
      blog.id,
    );

    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.CREATED);

    const bodyFromCreateResponse: PostViewDto =
      resCreatePost.body as PostViewDto;

    expect(bodyFromCreateResponse).toEqual({
      id: expect.any(String),
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: ReactionStatus.None,
        newestLikes: [],
      },
      createdAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });

    const newlyCreatedPost: PostViewDto = await postsTestManager.getById(
      bodyFromCreateResponse.id,
    );

    expect(bodyFromCreateResponse).toEqual(newlyCreatedPost);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromCreateResponse,
        resCreatePost.statusCode,
        'Test №1: PostsController - createPost() (POST: /posts)',
      );
    }
  });

  it('should not create a post if the admin is not authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const [dto]: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      1,
      blog.id,
    );

    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send(dto)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePost.body,
        resCreatePost.statusCode,
        'Test №2: PostsController - createPost() (POST: /posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (an empty object is passed).', async () => {
    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send({})
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePost.body).toEqual({
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

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePost.body,
        resCreatePost.statusCode,
        'Test №3: PostsController - createPost() (POST: /posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: empty line,  short Description: empty line, content: empty line, blogId: empty line).', async () => {
    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send({
        title: '   ',
        shortDescription: '   ',
        content: '   ',
        blogId: '   ',
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePost.body).toEqual({
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

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePost.body,
        resCreatePost.statusCode,
        'Test №4: PostsController - createPost() (POST: /posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: exceeds max length, shortDescription: exceeds max length, content: exceeds max length, blogId: incorrect).', async () => {
    const title: string = TestUtils.generateRandomString(31);
    const shortDescription: string = TestUtils.generateRandomString(101);
    const content: string = TestUtils.generateRandomString(1001);
    const blogId: string = TestUtils.generateRandomString(10);

    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send({
        title,
        shortDescription,
        content,
        blogId,
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePost.body).toEqual({
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

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePost.body,
        resCreatePost.statusCode,
        'Test №5: PostsController - createPost() (POST: /posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: type number, shortDescription: type number, content: type number, blogId: incorrect).', async () => {
    const resCreatePost: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/posts`)
      .send({
        title: 123,
        shortDescription: 123,
        content: 123,
        blogId: 123,
      })
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePost.body).toEqual({
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

    const posts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(posts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePost.body,
        resCreatePost.statusCode,
        'Test №6: PostsController - createPost() (POST: /posts)',
      );
    }
  });
});
