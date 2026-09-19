// Dexie-backed Patient Search Hook
// Reactive live queries via useLiveQuery from dexie-react-hooks.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Patient } from '../../types';

export type PatientSearchFilter = 'all' | 'name' | 'id' | 'village' | 'phone';

export interface UsePatientSearchResult {
  results: Patient[];
  isLoading: boolean;
  error: Error | null;
}

export function usePatientSearch(
  query: string,
  filter: PatientSearchFilter = 'all'
): UsePatientSearchResult {
  const results = useLiveQuery(async () => {
    const rawRows = await db.patients
      .filter((p) => !p.deleted_at)
      .toArray();

    const q = (query || '').trim().toLowerCase();

    // If query is empty, return the 20 most recently updated patients
    if (!q) {
      const sorted = [...rawRows].sort((a, b) => {
        const timeA = a.updated_at || a.lastVisitDate || a.registeredDate || '';
        const timeB = b.updated_at || b.lastVisitDate || b.registeredDate || '';
        return timeB.localeCompare(timeA);
      });
      return sorted.slice(0, 20);
    }

    // Filter patients where deleted_at is null according to filter type
    const matched = rawRows.filter((p) => {
      const fullName = (p.full_name || p.fullName || '').toLowerCase();
      const extId = (p.external_id || p.clinicId || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      const village = (p.village || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();

      switch (filter) {
        case 'name':
          return fullName.includes(q);
        case 'id':
          return extId.includes(q) || id.startsWith(q);
        case 'village':
          return village.includes(q);
        case 'phone':
          return phone.includes(q);
        case 'all':
        default:
          return (
            fullName.includes(q) ||
            village.includes(q) ||
            extId.includes(q) ||
            phone.includes(q) ||
            id.startsWith(q)
          );
      }
    });

    // Ranking order:
    // 1. exact external_id match (case-insensitive)
    // 2. full_name starts with q (case-insensitive)
    // 3. full_name contains q
    // 4. village match
    // 5. phone match
    matched.sort((a, b) => {
      const getScore = (p: typeof a) => {
        const fullName = (p.full_name || p.fullName || '').toLowerCase();
        const extId = (p.external_id || p.clinicId || '').toLowerCase();
        const village = (p.village || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();

        if (extId === q || p.id.toLowerCase() === q) return 1;
        if (fullName.startsWith(q)) return 2;
        if (fullName.includes(q)) return 3;
        if (village.includes(q)) return 4;
        if (phone.includes(q)) return 5;
        return 6;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;

      // Secondary alphabetical sort
      const nameA = a.full_name || a.fullName || '';
      const nameB = b.full_name || b.fullName || '';
      return nameA.localeCompare(nameB);
    });

    return matched.slice(0, 50);
  }, [query, filter]);

  const isLoading = results === undefined;

  return {
    results: results ?? [],
    isLoading,
    error: null,
  };
}
