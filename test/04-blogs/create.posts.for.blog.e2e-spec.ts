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
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import {
  LikeStatus,
  PostViewDto,
} from '../../src/modules/bloggers-platform/posts/api/view-dto/post-view.dto';
import { PostInputDto } from '../../src/modules/bloggers-platform/posts/api/input-dto/post-input.dto';
import { HttpStatus } from '@nestjs/common';
import { PostsTestManager } from '../managers/posts.test-manager';
import { ObjectId } from 'mongodb';

describe('BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)', () => {
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

  it('should create a new post, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const [dto]: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      1,
      blog.id,
    );

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.CREATED);

    const bodyFromCreateRequest: PostViewDto =
      resCreatePosts.body as PostViewDto;

    expect(bodyFromCreateRequest).toEqual<PostViewDto>({
      id: expect.any(String),
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog.id,
      blogName: blog.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
      createdAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(bodyFromCreateRequest).toEqual<PostViewDto>(allPosts.items[0]);

    expect(allPosts.items).toHaveLength(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E<PostViewDto>(
        bodyFromCreateRequest,
        resCreatePosts.statusCode,
        'Test №1: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the admin is not authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const [dto]: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      1,
      blog.id,
    );

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .expect(HttpStatus.UNAUTHORIZED);

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №2: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (an empty object is passed).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({})
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePosts.body).toEqual({
      errorsMessages: [
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

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №3: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: empty line, shortDescription: empty line, content: empty line).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({
        title: '   ',
        shortDescription: '   ',
        content: '   ',
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePosts.body).toEqual({
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

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №4: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: exceeds max length, shortDescription: exceeds max length, content: exceeds max length).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const title: string = TestUtils.generateRandomString(31);
    const shortDescription: string = TestUtils.generateRandomString(101);
    const content: string = TestUtils.generateRandomString(1001);

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({
        title,
        shortDescription,
        content,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePosts.body).toEqual({
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

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №5: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (title: type number, shortDescription: type number, content: type number).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${blog.id}/posts`)
      .send({
        title: 123,
        shortDescription: 123,
        content: 123,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.BAD_REQUEST);

    expect(resCreatePosts.body).toEqual({
      errorsMessages: [
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

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №6: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });

  it('should not create a post if the data in the request body is incorrect (blogId: incorrect).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const [dto]: PostInputDto[] = TestDtoFactory.generatePostInputDto(
      1,
      blog.id,
    );

    const incorrectBlogId: string = new ObjectId().toString();

    const resCreatePosts: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/blogs/${incorrectBlogId}/posts`)
      .send({
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
      })
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .expect(HttpStatus.NOT_FOUND);

    const allPosts: PaginatedViewDto<PostViewDto> =
      await postsTestManager.getAll();

    expect(allPosts.items).toHaveLength(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resCreatePosts.body,
        resCreatePosts.statusCode,
        'Test №7: BlogsController - createPostForBlog() (POST: /blogs/{blogId}/posts)',
      );
    }
  });
});
