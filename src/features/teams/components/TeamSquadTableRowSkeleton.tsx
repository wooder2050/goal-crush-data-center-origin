'use client';

import { TableCell, TableRow } from '@/components/ui/table';

export default function TeamSquadTableRowSkeleton() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="w-[44px] pr-0">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
      </TableCell>
      <TableCell className="pl-2">
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <div className="h-5 w-8 bg-gray-200 rounded mx-auto" />
      </TableCell>
      <TableCell className="hidden sm:table-cell text-center">
        <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />
      </TableCell>
      <TableCell className="text-center">
        <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />
      </TableCell>
    </TableRow>
  );
}
