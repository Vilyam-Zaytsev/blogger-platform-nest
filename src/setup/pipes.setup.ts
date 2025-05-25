import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Extension } from '../core/exceptions/damain-exceptions';
import { ValidationException } from '../core/exceptions/validation-exception';
//TODO: написать unit test
export const errorFormatter = (errors: ValidationError[]): Extension[] => {
  const errorsForResponse: Extension[] = [];
  const stack = [...errors];

  while (stack.length > 0) {
    const error = stack.pop()!;
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        errorsForResponse.push({
          field: error.property,
          message: message ? `${message}; Received value: ${error.value}` : '',
        });
      }
    } else if (error.children && error.children.length > 0) {
      stack.push(...error.children);
    }
  }

  return errorsForResponse;
};

function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errorFormatter(errors);

        throw new ValidationException(formattedErrors);
      },
    }),
  );
}

export { pipesSetup };
