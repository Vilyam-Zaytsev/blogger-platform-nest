import { CryptoService } from './crypto.service';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { AppTestManager } from '../../../../test/managers/app.test-manager';
import { connection } from 'mongoose';
import { UserValidationService } from './user-validation.service';
import { UserInputDto } from '../api/input-dto/user.input-dto';
import { TestDtoFactory } from '../../../../test/helpers/test.dto-factory';

describe('UserValidationService (integration)', () => {
  let appTestManager: AppTestManager;
  let userValidationService: UserValidationService;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    userValidationService = appTestManager.app.get<UserValidationService>(
      UserValidationService,
    );
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  describe('UserValidationService - validateUniqueUser', () => {
    it('should not throw error if user is unique', async () => {
      const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

      await expect(
        userValidationService.validateUniqueUser({
          login: dto.login,
          email: dto.email,
          password: dto.password,
        }),
      ).resolves.toBeUndefined();
    });

    //   it('should throw if login is already used', async () => {
    //     await connection.collection('users').insertOne({
    //       login: 'existingLogin',
    //       email: 'other@example.com',
    //       passwordHash: 'somehash',
    //     });
    //
    //     await expect(
    //       service.validateUniqueUser({
    //         login: 'existingLogin',
    //         email: 'new@example.com',
    //         password: '12345678',
    //       }),
    //     ).rejects.toThrow(DomainException);
    //   });
    //
    //   it('should throw if email is already used', async () => {
    //     await connection.collection('users').insertOne({
    //       login: 'anotherLogin',
    //       email: 'existing@example.com',
    //       passwordHash: 'somehash',
    //     });
    //
    //     await expect(
    //       service.validateUniqueUser({
    //         login: 'newLogin',
    //         email: 'existing@example.com',
    //         password: '12345678',
    //       }),
    //     ).rejects.toThrow(DomainException);
    //   });
    // });
    //
    // describe('authenticateUser', () => {
    //   const crypto = new CryptoService();
    //   let passwordHash: string;
    //
    //   beforeAll(async () => {
    //     passwordHash = await crypto.hashPassword('password123');
    //     await connection.collection('users').insertOne({
    //       login: 'loginUser',
    //       email: 'auth@example.com',
    //       passwordHash,
    //     });
    //   });
    //
    //   it('should return user context for valid credentials', async () => {
    //     const user = await service.authenticateUser(
    //       'auth@example.com',
    //       'password123',
    //     );
    //     expect(user).toHaveProperty('id');
    //   });
    //
    //   it('should throw if user does not exist', async () => {
    //     await expect(
    //       service.authenticateUser('notfound@example.com', 'password123'),
    //     ).rejects.toThrow(DomainException);
    //   });
    //
    //   it('should throw if password is invalid', async () => {
    //     await expect(
    //       service.authenticateUser('auth@example.com', 'wrongpassword'),
    //     ).rejects.toThrow(DomainException);
    //   });
  });
});
