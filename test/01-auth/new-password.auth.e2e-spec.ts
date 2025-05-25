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
import { TestUtils } from '../helpers/test.utils';

describe('AuthController - newPassword() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let usersRepository: UsersRepository;
  let adminCredentials: AdminCredentials;
  let server: Server;
  let sendEmailMock: jest.Mock;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

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

  it('should update the password if the user has sent the correct data: (newPassword, recoveryCode)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    await usersTestManager.passwordRecovery(user.email);

    const found_user_1: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_1).not.toBeNull();

    if (!found_user_1) {
      throw new Error(
        'Test №1: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: expect.any(String),
          expirationDate: expect.any(Date),
        }),
      }),
    );

    const resNewPassword: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/new-password`)
      .send({
        newPassword: 'qwerty',
        recoveryCode: found_user_1.passwordRecovery.recoveryCode,
      })
      .expect(204);

    const found_user_2: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_2).not.toBeNull();

    if (!found_user_2) {
      throw new Error(
        'Test №1: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_2).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: null,
          expirationDate: null,
        }),
      }),
    );

    expect(found_user_1.passwordHash).not.toBe(found_user_2.passwordHash);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resNewPassword.body,
      resNewPassword.statusCode,
      'Test №1: AuthController - newPassword() (POST: /auth)',
    );
  });

  it('should not update the password if the user has sent incorrect data: (newPassword: less than 6 characters)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    await usersTestManager.passwordRecovery(user.email);

    const found_user_1: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_1).not.toBeNull();

    if (!found_user_1) {
      throw new Error(
        'Test №3: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: expect.any(String),
          expirationDate: expect.any(Date),
        }),
      }),
    );

    const resNewPassword: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/new-password`)
      .send({
        newPassword: 'qwert',
        recoveryCode: found_user_1.passwordRecovery.recoveryCode,
      })
      .expect(400);

    expect(resNewPassword.body).toEqual({
      errorsMessages: [
        {
          field: 'newPassword',
          message:
            'newPassword must be longer than or equal to 6 characters; Received value: qwert',
        },
      ],
    });

    const found_user_2: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_2).not.toBeNull();

    if (!found_user_2) {
      throw new Error(
        'Test №3: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1.passwordRecovery).toEqual(
      found_user_2.passwordRecovery,
    );

    expect(found_user_1.passwordHash).toBe(found_user_2.passwordHash);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resNewPassword.body,
      resNewPassword.statusCode,
      'Test №3: AuthController - newPassword() (POST: /auth)',
    );
  });

  it('should not update the password if the user has sent incorrect data: (newPassword: more than 20 characters)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    await usersTestManager.passwordRecovery(user.email);

    const found_user_1: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_1).not.toBeNull();

    if (!found_user_1) {
      throw new Error(
        'Test №4: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: expect.any(String),
          expirationDate: expect.any(Date),
        }),
      }),
    );

    const password: string = TestUtils.generateRandomString(21);

    const resNewPassword: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/new-password`)
      .send({
        newPassword: password,
        recoveryCode: found_user_1.passwordRecovery.recoveryCode,
      })
      .expect(400);

    expect(resNewPassword.body).toEqual({
      errorsMessages: [
        {
          field: 'newPassword',
          message: `newPassword must be shorter than or equal to 20 characters; Received value: ${password}`,
        },
      ],
    });

    const found_user_2: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_2).not.toBeNull();

    if (!found_user_2) {
      throw new Error(
        'Test №4: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1.passwordRecovery).toEqual(
      found_user_2.passwordRecovery,
    );

    expect(found_user_1.passwordHash).toBe(found_user_2.passwordHash);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resNewPassword.body,
      resNewPassword.statusCode,
      'Test №4: AuthController - newPassword() (POST: /auth)',
    );
  });

  it('should not update the password if the user has sent incorrect data: (recoveryCode)', async () => {
    const [user]: UserViewDto[] = await usersTestManager.createUser(1);

    await usersTestManager.passwordRecovery(user.email);

    const found_user_1: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_1).not.toBeNull();

    if (!found_user_1) {
      throw new Error(
        'Test №5: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1).toEqual(
      expect.objectContaining({
        passwordRecovery: expect.objectContaining({
          recoveryCode: expect.any(String),
          expirationDate: expect.any(Date),
        }),
      }),
    );

    const resNewPassword: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/new-password`)
      .send({
        newPassword: 'qwerty',
        recoveryCode: 'incorrect-recovery-code',
      })
      .expect(400);

    const found_user_2: UserDocument | null = await usersRepository.getByEmail(
      user.email,
    );

    expect(found_user_2).not.toBeNull();

    if (!found_user_2) {
      throw new Error(
        'Test №5: AuthController - newPassword() (POST: /auth): User not found',
      );
    }

    expect(found_user_1.passwordRecovery).toEqual(
      found_user_2.passwordRecovery,
    );

    expect(found_user_1.passwordHash).toBe(found_user_2.passwordHash);

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resNewPassword.body,
      resNewPassword.statusCode,
      'Test №5: AuthController - newPassword() (POST: /auth)',
    );
  });
});
