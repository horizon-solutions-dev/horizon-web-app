import type { PagedResponse, PagingInfo } from '../../models/pagination.model';

export type LegacyPagedResponse<T> = {
  data: T[];
  total: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
};

export const toPagingInfo = (
  value:
    | PagingInfo
    | {
        total: number;
        pageNumber: number;
        pageSize: number;
        totalPages?: number;
      },
): PagingInfo => ({
  total: value.total,
  pageNumber: value.pageNumber,
  pageSize: value.pageSize,
  totalPages: value.totalPages,
});

export const normalizePagedResponse = <T>(
  response: PagedResponse<T> | T[] | LegacyPagedResponse<T>,
  pageNumber?: number,
  pageSize?: number,
): PagedResponse<T> => {
  if (Array.isArray(response)) {
    const safePageNumber = pageNumber ?? 1;
    const safePageSize = pageSize || response.length || 1;
    return {
      items: response,
      paging: {
        total: response.length,
        pageNumber: safePageNumber,
        pageSize: safePageSize,
        totalPages: 1,
      },
    };
  }

  if ('items' in response && Array.isArray(response.items)) {
    return response;
  }

  if ('data' in response && Array.isArray(response.data)) {
    return {
      items: response.data ?? [],
      paging: toPagingInfo(response),
    };
  }

  return {
    items: [],
    paging: {
      total: 0,
      pageNumber: pageNumber ?? 1,
      pageSize: pageSize ?? 0,
      totalPages: 0,
    },
  };
};
