import { IsMongoId } from 'class-validator';

export class IdInputDto {
  @IsMongoId()
  id: string;
}
