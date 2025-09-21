"use client";

import { useState } from 'react';
import SchoolSearch from '@/components/SchoolSearch';
import { School } from '@/lib/schoolsService';

export default function SchoolsSelectPage() {
  const [selected, setSelected] = useState<School | null>(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Select Your School</h1>
        <SchoolSearch onSelect={setSelected} />
        {selected && (
          <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-200">
            <div className="font-semibold">{selected.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selected.township || '—'}, {selected.city || '—'} {selected.postal_code || ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


