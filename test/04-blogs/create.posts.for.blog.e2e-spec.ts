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
});
