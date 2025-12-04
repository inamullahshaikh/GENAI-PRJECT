import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialLimit = 20 } = options;
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    hasMore: false,
    total: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 })); // Reset to page 1 when limit changes
  }, []);

  const setPaginationData = useCallback((data: { hasMore: boolean; total: number }) => {
    setPagination((prev) => ({
      ...prev,
      hasMore: data.hasMore,
      total: data.total,
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: prev.hasMore ? prev.page + 1 : prev.page,
    }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      hasMore: false,
      total: 0,
    });
  }, [initialPage, initialLimit]);

  return {
    ...pagination,
    setPage,
    setLimit,
    setPaginationData,
    nextPage,
    prevPage,
    reset,
  };
}

