import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  DomainException,
  Extension,
} from '../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../core/exceptions/domain-exception-codes';
import { ValidationException } from '../core/exceptions/validation-exception';

// export const errorFormatter = (
//   errors: ValidationError[],
//   errorMessage?: Extension[],
// ): Extension[] => {
//   const errorsForResponse: Extension[] = errorMessage || [];
//
//   for (const error of errors) {
//     if (!error.constraints && error.children?.length) {
//       errorFormatter(error.children, errorsForResponse);
//     } else if (error.constraints) {
//       const constrainKeys = Object.keys(error.constraints);
//
//       for (const key of constrainKeys) {
//         errorsForResponse.push({
//           message: error.constraints[key]
//             ? `${error.constraints[key]}; Received value: ${error?.value}`
//             : '',
//           key: error.property,
//         });
//       }
//     }
//   }
//
//   return errorsForResponse;
// };

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
