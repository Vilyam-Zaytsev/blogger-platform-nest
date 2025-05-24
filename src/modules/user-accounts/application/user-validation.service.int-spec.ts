import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { AppTestManager } from '../../../../test/managers/app.test-manager';
import { UserValidationService } from './user-validation.service';
import { UserInputDto } from '../api/input-dto/user.input-dto';
import { TestDtoFactory } from '../../../../test/helpers/test.dto-factory';
import { UsersTestManager } from '../../../../test/managers/users.test-manager';
import { AdminCredentials } from '../../../../test/types';
import { Server } from 'http';
import { UserViewDto } from '../api/view-dto/user.view-dto';
import { CryptoService } from './crypto.service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { TestLoggers } from '../../../../test/helpers/test.loggers';

describe('UserValidationService (integration)', () => {
  let appTestManager: AppTestManager;
  let userValidationService: UserValidationService;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    userValidationService = appTestManager.app.get<UserValidationService>(
      UserValidationService,
    );
    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    usersTestManager = new UsersTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  describe('UserValidationService - validateUniqueUser()', () => {
    it('should not throw error if user is unique', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await expect(
        userValidationService.validateUniqueUser({
          login: dto.login,
          email: dto.email,
          password: dto.password,
        }),
      ).resolves.toBeUndefined();
    });

    it('should throw error if login is already used', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      const [user]: UserViewDto[] = await usersTestManager.createUser(1);

      await expect(
        userValidationService.validateUniqueUser({
          login: user.login,
          email: dto.email,
          password: dto.password,
        }),
      ).rejects.toThrow(DomainException);
    });

    it('should throw error if email is already used', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      const [user]: UserViewDto[] = await usersTestManager.createUser(1);

      await expect(
        userValidationService.validateUniqueUser({
          login: dto.login,
          email: user.email,
          password: dto.password,
        }),
      ).rejects.toThrow(DomainException);
    });
  });

  describe('UserValidationService - authenticateUser()', () => {
    let comparePasswordMock: jest.SpyInstance;

    beforeAll(async () => {
      comparePasswordMock = jest
        .spyOn(CryptoService.prototype, 'comparePassword')
        .mockImplementation(
          async ({
            password,
            hash,
          }: {
            password: string;
            hash: string;
          }): Promise<boolean> => {
            return password === 'qwerty';
          },
        );
    });

    beforeEach(() => {
      comparePasswordMock.mockClear();
    });

    it('should return a UserContextDto upon successful authentication №1', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      const userContext: UserContextDto =
        await userValidationService.authenticateUser(dto.email, dto.password);

      expect(userContext).toHaveProperty('id');

      TestLoggers.logUnit<UserContextDto>(
        userContext,
        'Test №1: UserValidationService - authenticateUser()',
      );
    });

    it('should return a UserContextDto upon successful authentication №2', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      const userContext: UserContextDto =
        await userValidationService.authenticateUser(dto.login, dto.password);

      expect(userContext).toHaveProperty('id');

      TestLoggers.logUnit<UserContextDto>(
        userContext,
        'Test №2: UserValidationService - authenticateUser()',
      );
    });

    it('should throw error if email is invalid', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      await expect(
        userValidationService.authenticateUser(
          'invalid_email@example.com',
          dto.password,
        ),
      ).rejects.toThrow(DomainException);
    });

    it('should throw error if login is invalid', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      await expect(
        userValidationService.authenticateUser('invalid_login', dto.password),
      ).rejects.toThrow(DomainException);
    });

    it('should throw error if password is invalid №1', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      await expect(
        userValidationService.authenticateUser(dto.login, 'invalid_password'),
      ).rejects.toThrow(DomainException);
    });

    it('should throw error if password is invalid №2', async () => {
      const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

      await usersTestManager.createUser(1);

      await expect(
        userValidationService.authenticateUser(dto.email, 'invalid_password'),
      ).rejects.toThrow(DomainException);
    });
  });
});
