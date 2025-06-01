import request, { Response } from 'supertest';
import { TestUtils } from '../helpers/test.utils';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog-input.dto';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { HttpStatus } from '@nestjs/common';

describe('BlogsController - updateBlog() (POST: /blogs)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
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
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should update blog, the admin is authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const updateBlogDto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'https://update.websiteUrl.com',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send(updateBlogDto)
      .expect(HttpStatus.NO_CONTENT);

    const updatedBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).not.toEqual(updatedBlog);

    expect(typeof updatedBlog.id).toBe('string');
    expect(new Date(updatedBlog.createdAt).toString()).not.toBe('Invalid Date');
    expect(updatedBlog.name).toBe(updateBlogDto.name);
    expect(updatedBlog.description).toBe(updateBlogDto.description);
    expect(updatedBlog.websiteUrl).toBe(updateBlogDto.websiteUrl);
    expect(typeof updatedBlog.isMembership).toBe('boolean');

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №1: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update the blog if the user has not been authenticated.', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const updateBlogDto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'https://update.websiteUrl.com',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          'incorrect_login',
          'incorrect_password',
        ),
      )
      .send(updateBlogDto)
      .expect(HttpStatus.UNAUTHORIZED);

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №2: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (an empty object is passed).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ' regular expression; Received value: undefined',
        },
        {
          field: 'description',
          message: 'description must be a string; Received value: undefined',
        },
        {
          field: 'name',
          message: 'name must be a string; Received value: undefined',
        },
      ],
    });

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №3: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: empty line, description: empty line, website Url: empty line).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send({
        name: '   ',
        description: '   ',
        websiteUrl: '   ',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ' regular expression; Received value: ',
        },
        {
          field: 'description',
          message:
            'description must be longer than or equal to 1 characters; Received value: ',
        },
        {
          field: 'name',
          message:
            'name must be longer than or equal to 1 characters; Received value: ',
        },
      ],
    });

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №4: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: exceeds max length, description: exceeds max length, website Url: exceeds max length).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const name: string = TestUtils.generateRandomString(16);
    const description: string = TestUtils.generateRandomString(501);
    const websiteUrl: string = TestUtils.generateRandomString(101);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send({
        name,
        description,
        websiteUrl,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: ${websiteUrl}`,
        },
        {
          field: 'description',
          message: `description must be shorter than or equal to 500 characters; Received value: ${description}`,
        },
        {
          field: 'name',
          message: `name must be shorter than or equal to 15 characters; Received value: ${name}`,
        },
      ],
    });

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №5: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: type number, description: type number, website Url: type number).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send({
        name: 123,
        description: 123,
        websiteUrl: 123,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: 123`,
        },
        {
          field: 'description',
          message: `description must be a string; Received value: 123`,
        },
        {
          field: 'name',
          message: `name must be a string; Received value: 123`,
        },
      ],
    });

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №6: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (invalid url).', async () => {
    const [blog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const updateBlogDto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'incorrect websiteUrl',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${blog.id}`)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          adminCredentials.login,
          adminCredentials.password,
        ),
      )
      .send({
        name: updateBlogDto.name,
        description: updateBlogDto.description,
        websiteUrl: updateBlogDto.websiteUrl,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: ${updateBlogDto.websiteUrl}`,
        },
      ],
    });

    const foundBlog: BlogViewDto = await blogsTestManager.getById(blog.id);

    expect(blog).toEqual(foundBlog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №7: BlogsController - updateBlog() (POST: /blogs)',
      );
    }
  });
});
