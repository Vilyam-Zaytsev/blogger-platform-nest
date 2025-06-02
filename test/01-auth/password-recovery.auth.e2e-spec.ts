import { UsersTestManager } from '../managers/users.test-manager';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { EmailService } from '../../src/modules/notifications/email.service';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { EmailTemplate } from '../../src/modules/notifications/templates/types';
import { UserDocument } from '../../src/modules/user-accounts/domain/user.entity';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

describe('AuthController - passwordRecovery() (POST: /auth)', () => {
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

  it('should send the recovery code by email and save the recovery code and the date of the expiration to the database if the user has sent the correct data: (email address)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    const found_user_1: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_1).not.toBeNull();

    if (!found_user_1) {
      throw new Error(
        'Test №1: AuthController - passwordRecovery() (POST: /auth): User not found',
      );
    }

    expect(found_user_1).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: null,
          expirationDate: null,
        }),
      }),
    );

    const resPasswordRecovery: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
      .send({
        email: user.email,
      })
      .expect(204);

    const found_user_2: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_2).not.toBeNull();

    if (!found_user_2) {
      throw new Error(
        'Test №1: AuthController - passwordRecovery() (POST: /auth): User not found',
      );
    }

    expect(found_user_2).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: expect.any(String),
          expirationDate: expect.any(Date),
        }),
      }),
    );

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resPasswordRecovery.body,
        resPasswordRecovery.statusCode,
        'Test №1: AuthController - passwordRecovery() (POST: /auth)',
      );
    }
  });

  it(
    'should not send the recovery code by e-mail and save the recovery code and expiration date in the database if' +
      ' the user has sent !!!INCORRECT!!! data: (email address)',
    async () => {
      const [user]: UserViewDto[] = await usersTestManager.createUser(1);

      const found_user_1: UserDocument | null =
        await usersRepository.getByEmail(user.email);

      expect(found_user_1).not.toBeNull();

      if (!found_user_1) {
        throw new Error(
          'Test №3: AuthController - passwordRecovery() (POST: /auth): User not found',
        );
      }

      expect(found_user_1).toEqual(
        expect.objectContaining({
          passwordRecovery: expect.objectContaining({
            recoveryCode: null,
            expirationDate: null,
          }),
        }),
      );

      const resPasswordRecovery: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
        .send({
          email: 'incorrect-email@example.com',
        })
        .expect(204);

      const found_user_2: UserDocument | null =
        await usersRepository.getByEmail(user.email);

      expect(found_user_2).not.toBeNull();

      if (!found_user_2) {
        throw new Error(
          'Test №3: AuthController - passwordRecovery() (POST: /auth): User not found',
        );
      }

      expect(found_user_1).toEqual(found_user_2);

      expect(sendEmailMock).toHaveBeenCalledTimes(0);

      if (testLoggingEnabled) {
        TestLoggers.logE2E(
          resPasswordRecovery.body,
          resPasswordRecovery.statusCode,
          'Test №3: AuthController - passwordRecovery() (POST: /auth)',
        );
      }
    },
  );

  it(
    'should not send the recovery code by e-mail and save the recovery code and expiration date in the database if' +
      ' the user has sent !!!INVALID!!! data: (email address)',
    async () => {
      const [user]: UserViewDto[] = await usersTestManager.createUser(1);

      const found_user_1: UserDocument | null =
        await usersRepository.getByEmail(user.email);

      expect(found_user_1).not.toBeNull();

      if (!found_user_1) {
        throw new Error(
          'Test №4: AuthController - passwordRecovery() (POST: /auth): User not found',
        );
      }

      expect(found_user_1).toEqual(
        expect.objectContaining({
          passwordRecovery: expect.objectContaining({
            recoveryCode: null,
            expirationDate: null,
          }),
        }),
      );

      const resPasswordRecovery: Response = await request(server)
        .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(resPasswordRecovery.body).toEqual({
        errorsMessages: [
          {
            field: 'email',
            message:
              'email must match /^[\\w.-]+@([\\w-]+\\.)+[\\w-]{2,4}$/ regular expression; Received value: invalid-email',
          },
        ],
      });

      const found_user_2: UserDocument | null =
        await usersRepository.getByEmail(user.email);

      expect(found_user_2).not.toBeNull();

      if (!found_user_2) {
        throw new Error(
          'Test №4: AuthController - passwordRecovery() (POST: /auth): User not found',
        );
      }

      expect(found_user_1).toEqual(found_user_2);

      expect(sendEmailMock).toHaveBeenCalledTimes(0);

      if (testLoggingEnabled) {
        TestLoggers.logE2E(
          resPasswordRecovery.body,
          resPasswordRecovery.statusCode,
          'Test №4: AuthController - passwordRecovery() (POST: /auth)',
        );
      }
    },
  );
});
