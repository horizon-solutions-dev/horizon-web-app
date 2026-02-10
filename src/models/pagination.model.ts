export interface PagingInfo {
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

export interface PagedResponse<T> {
  items: T[];
  paging: PagingInfo;
}
