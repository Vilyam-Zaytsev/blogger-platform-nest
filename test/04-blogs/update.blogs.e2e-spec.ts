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
import { ObjectId } from 'mongodb';

describe('BlogsController - updateBlog() (PUT: /blogs)', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
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
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should update blog, the admin is authenticated.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const dto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'https://update.websiteUrl.com',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NO_CONTENT);

    const updatedBlog: BlogViewDto = await blogsTestManager.getById(
      createdBlog.id,
    );

    expect(createdBlog).not.toEqual(updatedBlog);

    expect(updatedBlog).toEqual({
      id: expect.any(String),
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №1: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update the blog if the user has not been authenticated.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const dto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'https://update.websiteUrl.com',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send(dto)
      .set('Authorization', 'incorrect admin credentials')
      .expect(HttpStatus.UNAUTHORIZED);

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №2: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (an empty object is passed).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send({})
      .set('Authorization', adminCredentialsInBase64)
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

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №3: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: empty line, description: empty line, website Url: empty line).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send({
        name: '   ',
        description: '   ',
        websiteUrl: '   ',
      })
      .set('Authorization', adminCredentialsInBase64)
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

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №4: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: exceeds max length, description: exceeds max length, website Url: exceeds max length).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const name: string = TestUtils.generateRandomString(16);
    const description: string = TestUtils.generateRandomString(501);
    const websiteUrl: string = TestUtils.generateRandomString(101);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send({
        name,
        description,
        websiteUrl,
      })
      .set('Authorization', adminCredentialsInBase64)
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

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №5: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (name: type number, description: type number, website Url: type number).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send({
        name: 123,
        description: 123,
        websiteUrl: 123,
      })
      .set('Authorization', adminCredentialsInBase64)
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

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №6: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should not update a blog if the data in the request body is incorrect (invalid url).', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const dto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'incorrect websiteUrl',
    };

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${createdBlog.id}`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.BAD_REQUEST);

    expect(resUpdateBlog.body).toEqual({
      errorsMessages: [
        {
          field: 'websiteUrl',
          message:
            'websiteUrl must match /^https:\\/\\/([a-zA-Z0-9_-]+\\.)+[a-zA-Z0-9_-]+(\\/[a-zA-Z0-9_-]+)*\\/?$/' +
            ` regular expression; Received value: ${dto.websiteUrl}`,
        },
      ],
    });

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №7: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });

  it('should return a 404 error if the blog does not exist.', async () => {
    const [createdBlog]: BlogViewDto[] = await blogsTestManager.createBlog(1);

    const dto: BlogInputDto = {
      name: 'updateName',
      description: 'update description',
      websiteUrl: 'https://update.websiteUrl.com',
    };

    const incorrectId: string = new ObjectId().toString();

    const resUpdateBlog: Response = await request(server)
      .put(`/${GLOBAL_PREFIX}/blogs/${incorrectId}`)
      .send(dto)
      .set('Authorization', adminCredentialsInBase64)
      .expect(HttpStatus.NOT_FOUND);

    const blog: BlogViewDto = await blogsTestManager.getById(createdBlog.id);

    expect(createdBlog).toEqual(blog);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resUpdateBlog.body,
        resUpdateBlog.statusCode,
        'Test №9: BlogsController - updateBlog() (PUT: /blogs)',
      );
    }
  });
});
