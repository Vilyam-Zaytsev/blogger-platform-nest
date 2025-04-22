import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { User } from './user.entity';
import { ConfirmationStatus } from './email-confirmation.schema';

describe('User Entity - createInstance()', () => {
  it('should correctly create a User instance with nested entities(ConfirmationStatus: "NotConfirmed")', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      isConfirmed: true,
    };

    //TODO: как правильно тестировать!?
    const user = User.createInstance(dto);

    console.log(user);

    expect(user).toEqual({
      login: dto.login,
      email: dto.email,
      passwordHash: dto.passwordHash,
      passwordRecovery: {
        recoveryCode: null,
        expirationDate: null,
      },
      emailConfirmation: {
        confirmationCode: null,
        expirationDate: null,
        confirmationStatus: ConfirmationStatus.Confirmed,
      },
    });
  });
});
