'use client';

import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  className,
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                  column.headerClassName
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort?.(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && (
                    <span className="flex flex-col">
                      {sortBy === column.key && sortOrder === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-primary-600" />
                      ) : sortBy === column.key && sortOrder === 'desc' ? (
                        <ChevronDown className="w-4 h-4 text-primary-600" />
                      ) : (
                        <ChevronUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  striped && 'odd:bg-gray-50',
                  hoverable && 'hover:bg-gray-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-sm text-gray-900', column.className)}
                    style={{ width: column.width }}
                  >
                    {column.render
                      ? column.render(
                          column.accessor
                            ? typeof column.accessor === 'function'
                              ? column.accessor(row)
                              : row[column.accessor as keyof T]
                            : undefined,
                          row
                        )
                      : column.accessor
                      ? typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : String(row[column.accessor as keyof T] ?? '')
                      : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, total, limit, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showPages = 5;
  let start = Math.max(1, currentPage - Math.floor(showPages / 2));
  let end = Math.min(totalPages, start + showPages - 1);

  if (end - start + 1 < showPages) {
    start = Math.max(1, end - showPages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className={cn('flex items-center justify-between py-4', className)} aria-label="Pagination">
      <div className="text-sm text-gray-700">
        {total && limit && (
          <span>
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total} results
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded-md"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">1</button>
            {start > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              'px-3 py-1 text-sm rounded-md',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 text-sm rounded-md hover:bg-gray-100">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 rounded-md"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </nav>
  );
}