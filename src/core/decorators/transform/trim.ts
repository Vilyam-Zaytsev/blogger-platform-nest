import { Transform, TransformFnParams } from 'class-transformer';

export const Trim = () => {
  return Transform(({ value }: TransformFnParams): any => {
    return typeof value === 'string' ? value.trim() : value;
  });
};
