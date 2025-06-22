import request, { Response } from 'supertest';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { EmailService } from '../../src/modules/notifications/email.service';
import { EmailTemplate } from '../../src/modules/notifications/templates/types';
import { TestUtils } from '../helpers/test.utils';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { HttpStatus } from '@nestjs/common';

describe('AuthController - registrationEmailResending() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
  let testLoggingEnabled: boolean;
  let server: Server;
  let sendEmailMock: jest.Mock;

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

    usersTestManager = new UsersTestManager(server, adminCredentialsInBase64);

    sendEmailMock = jest
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue() as jest.Mock<Promise<void>, [string, EmailTemplate]>;
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    sendEmailMock.mockClear();

    appTestManager.clearThrottlerStorage();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should should send the verification code again if the user has sent the correct data.', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    await usersTestManager.registration(dto);

    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({
        email: dto.email,
      })
      .expect(HttpStatus.NO_CONTENT);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(2);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №1: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });

  it('should not resend the verification code if the user has sent incorrect data - an empty object is passed', async () => {
    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({})
      .expect(HttpStatus.BAD_REQUEST);

    expect(resRegistrationEmailResending.body).toEqual({
      errorsMessages: [
        {
          field: 'email',
          message:
            'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: undefined',
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №3: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });

  it('should not resend the verification code if the user has sent incorrect data - email: empty line', async () => {
    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({
        email: '   ',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resRegistrationEmailResending.body).toEqual({
      errorsMessages: [
        {
          field: 'email',
          message:
            'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: ',
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №4: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });

  it('should not resend the verification code if the user has sent incorrect data - email: incorrect', async () => {
    const email: string = TestUtils.generateRandomString(10);

    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({
        email,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resRegistrationEmailResending.body).toEqual({
      errorsMessages: [
        {
          field: 'email',
          message: `email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: ${email}`,
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №5: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });

  it('should not resend the verification code if the user has sent incorrect data - email: type number', async () => {
    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({
        email: 123,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resRegistrationEmailResending.body).toEqual({
      errorsMessages: [
        {
          field: 'email',
          message: `email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: 123`,
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №6: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });

  it('should not resend the verification code if the user has already confirmed the account', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const resRegistrationEmailResending: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-email-resending`)
      .send({
        email: user.email,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resRegistrationEmailResending.body).toEqual({
      errorsMessages: [
        {
          message: `The email address (${user.email}) is incorrect or has already been verified`,
          field: 'email',
        },
      ],
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(0);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationEmailResending.body,
        resRegistrationEmailResending.statusCode,
        'Test №7: AuthController - registrationEmailResending() (POST: /auth)',
      );
    }
  });
});
