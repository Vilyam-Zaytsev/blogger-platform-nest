// import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
// import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
//
// export class Filter {
//   private static propertyMap: Partial<Record<string, string>> = {};
//
//   private static createPropertyMap<T>(obj: T, prefix?: string): void {
//     for (const key in obj) {
//       const value: any = obj[key];
//       const path: string = prefix ? `${prefix}.${key}` : key;
//
//       if (
//         value !== null &&
//         typeof value === 'object' &&
//         !Array.isArray(value)
//       ) {
//         this.createPropertyMap(value, path);
//       } else {
//         this.propertyMap[key] = path;
//       }
//     }
//   }
//
//   private static getValueByPath<T>(obj: T, path: string): any {
//     return path.split('.').reduce((acc: any, key) => acc && acc[key], obj);
//   }
//
//   private static compareValues(
//     a: any,
//     b: any,
//     direction: SortDirection,
//   ): number {
//     if (typeof a === 'string' && typeof b === 'string') {
//       const comparison: number = a.localeCompare(b);
//
//       return direction === SortDirection.Ascending ? comparison : -comparison;
//     }
//
//     if (a < b) return direction === SortDirection.Ascending ? -1 : 1;
//     if (a > b) return direction === SortDirection.Descending ? 1 : -1;
//
//     return 0;
//   }
//
//   static sort<T>(items: T[], query: GetUsersQueryParams): Filter {
//     const { sortBy, sortDirection } = query;
//     this.createPropertyMap<T>(items[0]);
//
//     const path: string | undefined = this.propertyMap[sortBy];
//
//     if (!path) throw new Error(`Invalid sortBy property: ${sortBy}`);
//
//     items.sort((a, b): number => {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//       const aValue: any = this.getValueByPath(a, path);
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//       const bValue: any = this.getValueByPath(b, path);
//
//       return this.compareValues(aValue, bValue, sortDirection);
//     });
//
//     return this;
//   }
//
//   static skip<T>(items: T[]);
// }

import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { SearchFilter } from '../types';

export class Filter<T extends object> {
  private items: T[];
  private propertyMap: Partial<Record<keyof T, string>> = {};
  private skipCount: number = 0;
  private limitCount?: number;
  private sortBy?: keyof T;
  private sortDirection?: SortDirection;
  private searchFilterMap: Partial<Record<keyof SearchFilter, keyof T>>;

  constructor(
    items: T[],
    searchFilterMap: Partial<Record<keyof SearchFilter, keyof T>>,
  ) {
    this.items = items;
    this.searchFilterMap = searchFilterMap;
  }

  /**
   * Рекурсивно строит карту путей к свойствам объекта.
   * @param obj Объект для анализа
   * @param prefix Префикс пути (для вложенных свойств)
   */
  private createPropertyMap(obj: T, prefix?: string): void {
    const recordObj = obj as unknown as Record<string, unknown>;
    for (const key in recordObj) {
      const value = recordObj[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        this.createPropertyMap(value as unknown as T, path);
      } else {
        // Здесь ключ приводим к keyof T, потому что propertyMap типизирована по ключам T
        this.propertyMap[key as keyof T] = path;
      }
    }
  }

  /**
   * Получает значение из объекта по строковому пути с разделителем '.'
   * @param obj Объект для доступа
   * @param path Путь к свойству вида 'user.name.first'
   */
  private getValueByPath(obj: T, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Сравнивает два значения с учётом направления сортировки
   */
  private compareValues(
    a: unknown,
    b: unknown,
    direction: SortDirection,
  ): number {
    if (typeof a === 'string' && typeof b === 'string') {
      const comparison: number = a.localeCompare(b);
      return direction === SortDirection.Ascending ? comparison : -comparison;
    }
    if (typeof a === 'number' && typeof b === 'number') {
      if (a < b) return direction === SortDirection.Ascending ? -1 : 1;
      if (a > b) return direction === SortDirection.Ascending ? 1 : -1;
      return 0;
    }
    // Можно добавить сравнение для других типов, если нужно
    return 0;
  }

  /**
   * Устанавливает параметры сортировки
   * @param sortObj Объект с ключом из keyof T и значением SortDirection
   */
  sort(sortObj: Partial<Record<keyof T, SortDirection>>): this {
    const keys = Object.keys(sortObj) as (keyof T)[];
    if (keys.length === 0) return this;

    this.sortBy = keys[0];
    this.sortDirection = sortObj[this.sortBy];

    if (this.items.length > 0) {
      this.createPropertyMap(this.items[0]);
    }

    return this;
  }

  /**
   * Устанавливает количество пропускаемых элементов
   */
  skip(count: number): this {
    this.skipCount = count;
    return this;
  }

  /**
   * Устанавливает лимит выборки
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  filter(searchFilter: Partial<SearchFilter>): this {
    this.items = this.items.filter((item) => {
      for (const key in searchFilter) {
        const searchTerm = searchFilter[key as keyof SearchFilter];
        if (searchTerm != null && searchTerm !== '') {
          const itemKey = this.searchFilterMap[key as keyof SearchFilter];
          if (!itemKey) {
            // Если маппинга нет, пропускаем фильтр
            continue;
          }

          const itemValue = item[itemKey];

          if (typeof itemValue !== 'string') {
            return false;
          }

          if (!itemValue.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });

    return this;
  }

  /**
   * Возвращает итоговый массив с применёнными сортировкой, пропуском и лимитом
   */
  getResult(): T[] {
    let result: T[] = [...this.items];

    if (this.sortBy && this.sortDirection) {
      const path = this.propertyMap[this.sortBy];
      if (!path) {
        throw new Error(`Invalid sortBy property: ${String(this.sortBy)}`);
      }

      result = result.sort((a, b) => {
        const aValue = this.getValueByPath(a, path);
        const bValue = this.getValueByPath(b, path);
        return this.compareValues(aValue, bValue, this.sortDirection!);
      });
    }

    if (this.skipCount) {
      result = result.slice(this.skipCount);
    }

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }
}
