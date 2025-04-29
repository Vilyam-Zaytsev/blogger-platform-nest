import { Type } from 'class-transformer';

export enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

export abstract class BaseQueryParams<T> {
  @Type(() => Number)
  pageNumber: number = 1;
  @Type(() => Number)
  pageSize: number = 10;
  sortDirection: SortDirection = SortDirection.Descending;
  abstract sortBy: T;

  calculateSkip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
