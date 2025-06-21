import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { TrimDecorator } from '../transform/trim.decorator';

export const IsStringWithTrimDecorator = (
  minLength: number,
  maxLength: number,
) => applyDecorators(IsString(), Length(minLength, maxLength), TrimDecorator());
