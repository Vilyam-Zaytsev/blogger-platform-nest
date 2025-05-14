export type FieldError = {
  message: string;
  field: string;
};

export type ErrorValidationResponseBody = {
  errorsMessages: FieldError[];
};
