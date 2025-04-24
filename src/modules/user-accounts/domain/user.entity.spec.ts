import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { User } from './user.entity';
import {
  ConfirmationStatus,
  EmailConfirmation,
} from './email-confirmation.schema';
import { PasswordRecovery } from './password-recovery.schema';

describe('User Entity - createInstance()', () => {
  it('should correctly create a User instance with nested entities(ConfirmationStatus: "Confirmed")', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      isConfirmed: true,
    };

    const user = User.createInstance(dto);

    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);
    expect(user.passwordHash).toBe(dto.passwordHash);

    expect(user).toHaveProperty('passwordRecovery');
    expect(user.passwordRecovery).toBeInstanceOf(PasswordRecovery);

    expect(user.emailConfirmation).toBeInstanceOf(EmailConfirmation);
    expect(user.emailConfirmation.confirmationStatus).toBe(
      ConfirmationStatus.Confirmed,
    );
  });

  it('should correctly create a User instance with nested entities(ConfirmationStatus: "NotConfirmed")', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      isConfirmed: false,
    };

    const user = User.createInstance(dto);

    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);
    expect(user.passwordHash).toBe(dto.passwordHash);

    expect(user).toHaveProperty('passwordRecovery');
    expect(user.passwordRecovery).toBeInstanceOf(PasswordRecovery);

    expect(user.emailConfirmation).toBeInstanceOf(EmailConfirmation);
    expect(user.emailConfirmation.confirmationStatus).toBe(
      ConfirmationStatus.NotConfirmed,
    );
  });
});
