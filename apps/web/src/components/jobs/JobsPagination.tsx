'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JobsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function JobsPagination({ currentPage, totalPages, onPageChange }: JobsPaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Önceki
      </Button>

      {getVisiblePages().map((page, index) => (
        <Button
          key={index}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={page === '...' 
            ? 'cursor-default text-[#F6E6C3]/60' 
            : page === currentPage 
              ? 'bg-[#962901] text-[#F6E6C3] hover:opacity-90' 
              : 'border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10'
          }
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10 disabled:opacity-50"
      >
        Sonraki
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
