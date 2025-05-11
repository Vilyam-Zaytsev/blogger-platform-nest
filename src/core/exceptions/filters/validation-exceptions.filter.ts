// import {
//   ArgumentsHost,
//   BadRequestException,
//   Catch,
//   ExceptionFilter,
// } from '@nestjs/common';
// import { Response } from 'express';
// import { ErrorBadRequestResponseBody } from './error-bad-request-response-body.type';
//
// interface ValidationExceptionResponse {
//   statusCode: number;
//   message: string[];
//   error: string;
// }
//
// @Catch(BadRequestException)
// export class ValidationExceptionsFilter implements ExceptionFilter {
//   catch(exception: BadRequestException, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//
//     const status: number = exception.getStatus();
//     // const responseBody: ErrorBadRequestResponseBody =
//     //   this.buildResponseBody(exception);
//
//     // response.status(status).json(responseBody);
//
//     const exceptionResponse =
//       exception.getResponse() as ValidationExceptionResponse;
//
//     const message: string[] = Array.isArray(exceptionResponse.message)
//       ? exceptionResponse.message
//       : [exceptionResponse.message];
//
//     console.log(exceptionResponse);
//
//     response.status(status).json({
//       statusCode: status,
//       error: 'Validation failed',
//       messages: Array.isArray(message) ? message : [message],
//       timestamp: new Date().toISOString(),
//     });
//   }
//
//   private buildResponseBody(
//     exception: BadRequestException,
//   ): ErrorBadRequestResponseBody {
//     return {
//       errorsMessages: [
//         {
//           message: exception.message,
//           field: exception.name,
//         },
//       ],
//     };
//   }
// }
