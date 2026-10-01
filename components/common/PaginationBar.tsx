import React from "react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
      <div>
        Page {page} of {Math.max(1, totalPages)}
        {totalItems !== undefined && ` (${totalItems.toLocaleString()} total)`}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
