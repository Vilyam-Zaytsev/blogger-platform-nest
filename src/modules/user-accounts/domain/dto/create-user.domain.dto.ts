export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  confirmationCode: string;
  expirationDate: Date;
}
