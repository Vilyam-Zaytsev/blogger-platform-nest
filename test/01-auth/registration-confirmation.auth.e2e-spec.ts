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
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { UserDocument } from '../../src/modules/user-accounts/domain/user.entity';
import { ConfirmationStatus } from '../../src/modules/user-accounts/domain/email-confirmation.schema';
import { TestUtils } from '../helpers/test.utils';

describe('AuthController - registrationConfirmation() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let usersRepository: UsersRepository;
  let adminCredentials: AdminCredentials;
  let testLoggingEnabled: boolean;
  let server: Server;
  let sendEmailMock: jest.Mock;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    usersTestManager = new UsersTestManager(server, adminCredentials);
    usersRepository = appTestManager.app.get(UsersRepository);

    sendEmailMock = jest
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue() as jest.Mock<Promise<void>, [string, EmailTemplate]>;
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    sendEmailMock.mockClear();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should be confirmed if the user has sent the correct verification code.', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    await usersTestManager.registration(dto);

    const user_notConfirmed: UserDocument | null =
      await usersRepository.getByEmail(dto.email);

    expect(user_notConfirmed).not.toBeNull();

    if (!user_notConfirmed) {
      throw new Error(
        'Test №1: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user_notConfirmed).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: expect.any(String),
          expirationDate: expect.any(Date),
          confirmationStatus: ConfirmationStatus.NotConfirmed,
        }),
      }),
    );

    const resRegistrationConfirmation: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({
        code: user_notConfirmed.emailConfirmation.confirmationCode,
      })
      .expect(204);

    const user_confirmed: UserDocument | null =
      await usersRepository.getByEmail(dto.email);

    expect(user_confirmed).not.toBeNull();

    if (!user_confirmed) {
      throw new Error(
        'Test №1: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user_confirmed).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: null,
          expirationDate: null,
          confirmationStatus: ConfirmationStatus.Confirmed,
        }),
      }),
    );

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationConfirmation.body,
        resRegistrationConfirmation.statusCode,
        'Test №1: AuthController - registrationConfirmation() (POST: /auth)',
      );
    }
  });

  it('should not be confirmed if the user has sent an incorrect verification code.', async () => {
    const code: string = TestUtils.generateRandomString(15);

    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    await usersTestManager.registration(dto);

    const resRegistrationConfirmation: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({
        code,
      })
      .expect(400);

    expect(resRegistrationConfirmation.body).toEqual({
      errorsMessages: [
        {
          message: `Confirmation code (${code}) incorrect or the email address has already been confirmed`,
          field: 'code',
        },
      ],
    });

    const user: UserDocument | null = await usersRepository.getByEmail(
      dto.email,
    );

    expect(user).not.toBeNull();

    if (!user) {
      throw new Error(
        'Test №3: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: expect.any(String),
          expirationDate: expect.any(Date),
          confirmationStatus: ConfirmationStatus.NotConfirmed,
        }),
      }),
    );

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationConfirmation.body,
        resRegistrationConfirmation.statusCode,
        'Test №3: AuthController - registrationConfirmation() (POST: /auth)',
      );
    }
  });

  it('should not be confirmed if the user has sent an incorrect verification code (the code has already been used', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    await usersTestManager.registration(dto);

    const user_notConfirmed: UserDocument | null =
      await usersRepository.getByEmail(dto.email);

    expect(user_notConfirmed).not.toBeNull();

    if (!user_notConfirmed) {
      throw new Error(
        'Test №4: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user_notConfirmed).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: expect.any(String),
          expirationDate: expect.any(Date),
          confirmationStatus: ConfirmationStatus.NotConfirmed,
        }),
      }),
    );

    await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({
        code: user_notConfirmed.emailConfirmation.confirmationCode,
      })
      .expect(204);

    const user: UserDocument | null = await usersRepository.getByEmail(
      dto.email,
    );

    expect(user).not.toBeNull();

    if (!user) {
      throw new Error(
        'Test №4: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: null,
          expirationDate: null,
          confirmationStatus: ConfirmationStatus.Confirmed,
        }),
      }),
    );

    const resRegistrationConfirmation: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({
        code: user_notConfirmed.emailConfirmation.confirmationCode,
      })
      .expect(400);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resRegistrationConfirmation.body,
        resRegistrationConfirmation.statusCode,
        'Test №4: AuthController - registrationConfirmation() (POST: /auth)',
      );
    }
  });
});
