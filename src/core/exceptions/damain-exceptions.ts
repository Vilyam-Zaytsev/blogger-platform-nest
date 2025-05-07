import { DomainExceptionCode } from './domain-exception-codes';

export class Exception {
  constructor(
    public message: string,
    public key: string,
  ) {}
}

export class DomainException extends Error {
  message: string;
  code: DomainExceptionCode;
  extensions: Exception[];

  constructor(errorInfo: {
    code: DomainExceptionCode;
    message: string;
    extensions?: Exception[];
  }) {
    super(errorInfo.message);
    this.message = errorInfo.message;
    this.code = errorInfo.code;
    this.extensions = errorInfo.extensions || [];
  }
}
