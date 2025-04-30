import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { User, UserDocument } from './user.entity';
import { EmailConfirmation } from './email-confirmation.schema';
import { PasswordRecovery } from './password-recovery.schema';
import { TestLoggers } from '../../../../test/helpers/test-loggers';

describe('User Entity - createInstance()', () => {
  it('should correctly create a User instance with nested entities(ConfirmationStatus: "Confirmed")', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      confirmationCode: 'test_confirmation-code',
      expirationDate: new Date(),
    };

    const user: UserDocument = User.createInstance(dto);

    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);
    expect(user.passwordHash).toBe(dto.passwordHash);

    expect(user).toHaveProperty('passwordRecovery');
    expect(user.passwordRecovery).toBeInstanceOf(PasswordRecovery);

    expect(user).toHaveProperty('emailConfirmation');
    expect(user.emailConfirmation).toBeInstanceOf(EmailConfirmation);

    TestLoggers.logUnit<UserDocument>(
      user,
      'Test №1: User Entity - createInstance()',
    );
  });
});
