export type PaginationParams = {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

function toInt(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export function parsePagination(params: URLSearchParams, opts?: {
  defaultPageSize?: number;
  maxPageSize?: number;
}): PaginationParams {
  const defaultPageSize = opts?.defaultPageSize ?? 10;
  const maxPageSize = opts?.maxPageSize ?? 100;

  const rawPage = toInt(params.get("page"));
  const rawPageSize = toInt(params.get("pageSize"));

  const page = Math.max(1, rawPage ?? 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, rawPageSize ?? defaultPageSize));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset, limit: pageSize };
}

