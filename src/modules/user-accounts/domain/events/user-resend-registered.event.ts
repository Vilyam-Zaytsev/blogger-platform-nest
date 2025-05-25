export class UserResendRegisteredEvent {
  constructor(
    public readonly email: string,
    public readonly confirmationCode: string,
  ) {}
}
