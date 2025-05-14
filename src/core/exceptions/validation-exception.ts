import { DomainException, Extension } from './damain-exceptions';
import { DomainExceptionCode } from './domain-exception-codes';

export class ValidationException extends DomainException {
  constructor(extensions: Extension[]) {
    super({
      code: DomainExceptionCode.ValidationError,
      message: 'Validation failed',
      extensions,
    });
  }
}
