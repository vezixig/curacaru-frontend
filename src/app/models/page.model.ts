export interface Page<T> {
  items: T[];
  pageCount: number;
  page: number;
}
