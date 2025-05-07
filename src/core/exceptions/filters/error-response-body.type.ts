import { DomainExceptionCode } from '../domain-exception-codes';
import { Extension } from '../damain-exceptions';

export type ErrorResponseBody = {
  timestamp: string;
  path: string | null;
  message: string;
  extensions: Extension[];
  code: DomainExceptionCode;
};
