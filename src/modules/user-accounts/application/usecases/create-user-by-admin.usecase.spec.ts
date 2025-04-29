import { CreateUserByAdminUseCase } from './create-user-by-admin.usecase';
import { BcryptService } from '../bcrypt.service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from '../../dto/create-user.dto';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';
import { TestLoggers } from '../../../../../test/helpers/test-loggers';

describe('CreateUserByAdminUseCase', () => {
  let useCase: CreateUserByAdminUseCase;
  let bcryptService: jest.Mocked<BcryptService>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let UserModel: jest.Mocked<UserModelType>;

  beforeEach(async () => {
    bcryptService = {
      generateHash: jest.fn(),
    } as unknown as jest.Mocked<BcryptService>;

    usersRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    UserModel = {
      createInstance: jest.fn(),
    } as unknown as jest.Mocked<UserModelType>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserByAdminUseCase,
        { provide: BcryptService, useValue: bcryptService },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getModelToken(User.name), useValue: UserModel },
      ],
    }).compile();

    useCase = module.get(CreateUserByAdminUseCase);
  });

  it('should create user, hash password, and return saved userId ', async () => {
    const dto: CreateUserDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      password: 'qwerty',
    };

    const mockHashedPassword = 'hashedPassword';
    const mockUserId = 'mockUserId';
    const mockUserDocument: Partial<UserDocument> = {
      email: dto.email,
      login: dto.login,
      passwordHash: mockHashedPassword,
      emailConfirmation: {
        confirmationCode: null,
        expirationDate: null,
        confirmationStatus: ConfirmationStatus.Confirmed,
      },
    };

    bcryptService.generateHash.mockResolvedValue(mockHashedPassword);
    UserModel.createInstance.mockReturnValue(mockUserDocument as UserDocument);
    usersRepository.save.mockResolvedValue(mockUserId);

    const result: string = await useCase.execute(dto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bcryptService.generateHash).toHaveBeenCalledWith(dto.password);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UserModel.createInstance).toHaveBeenCalledWith({
      email: dto.email,
      login: dto.login,
      passwordHash: mockHashedPassword,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersRepository.save).toHaveBeenCalledWith(mockUserDocument);

    expect(result).toBe(mockUserId);

    TestLoggers.logUnit<string>(result, 'Test №1: CreateUserByAdminUseCase');
  });
});
