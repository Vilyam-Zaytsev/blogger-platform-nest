import { RegisterNewUserUseCase } from './register-new-user.usecase';
import { BcryptService } from '../bcrypt.service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from '../../dto/create-user.dto';
import { TestLoggers } from '../../../../../test/helpers/test-loggers';
import { ConfirmationStatus } from '../../domain/email-confirmation.schema';

describe('RegisterNewUserUseCase', () => {
  let useCase: RegisterNewUserUseCase;
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

    jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('mocked-uuid-1234-5678-abcd-1234567890ab');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterNewUserUseCase,
        { provide: BcryptService, useValue: bcryptService },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getModelToken(User.name), useValue: UserModel },
      ],
    }).compile();

    useCase = module.get(RegisterNewUserUseCase);
  });

  it('should register a new user', async () => {
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
        confirmationStatus: ConfirmationStatus.NotConfirmed,
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

    TestLoggers.logUnit<string>(result, 'Test №1: RegisterNewUserUseCase');
  });
});
