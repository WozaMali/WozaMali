"use client";

import { useEffect, useMemo, useState } from 'react';
import { searchSchoolsByName, School } from '@/lib/schoolsService';

interface SchoolSearchProps {
  onSelect: (school: School) => void;
  placeholder?: string;
}

export default function SchoolSearch({ onSelect, placeholder = 'Search for school' }: SchoolSearchProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<School[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debounced, setDebounced] = useState<string>('');

  // Debounce the search query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Run search when debounced query changes
  useEffect(() => {
    const run = async () => {
      if (debounced.length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error } = await searchSchoolsByName(debounced, 20);
      if (error) {
        setError('Unable to search schools');
        setResults([]);
      } else {
        setResults(data);
      }
      setLoading(false);
    };
    run();
  }, [debounced]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading && (
        <div className="text-xs text-gray-600 dark:text-gray-300">Searching…</div>
      )}
      {!loading && error && (
        <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
      )}
      {!loading && !error && debounced.length > 0 && results.length === 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-300">No schools found</div>
      )}
      {!loading && results.length > 0 && (
        <ul className="max-h-56 overflow-auto divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
          {results.map((s) => (
            <li key={s.id} className="p-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  {[s.address_line1, s.township, s.city].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                onClick={() => {
                  onSelect({
                    id: s.id,
                    emis_number: s.emis_number ?? null,
                    name: s.name,
                    phase: s.phase ?? null,
                    sector: s.sector ?? null,
                    ward: s.ward ?? null,
                    township: s.township ?? null,
                    address_line1: s.address_line1 ?? null,
                    address_line2: s.address_line2 ?? null,
                    city: s.city ?? null,
                    postal_code: s.postal_code ?? null,
                    latitude: s.latitude ?? null,
                    longitude: s.longitude ?? null,
                  });
                  // Clear search and close dropdown after selection
                  setQuery('');
                  setResults([]);
                }}
                aria-label="Select"
                title="Select"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
      {debounced.length < 2 && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400">Type at least 2 characters to search</div>
      )}
    </div>
  );
}


