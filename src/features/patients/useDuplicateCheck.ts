import { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { SEEDED_PATIENT } from './usePatient';
import { INITIAL_PATIENTS } from '../../data/initialData';

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[bn][an];
}

const ALL_KNOWN_PATIENTS: Patient[] = [
  SEEDED_PATIENT,
  ...INITIAL_PATIENTS.map((p) => ({
    id: p.id,
    clinicId: p.clinicId,
    fullName: p.fullName,
    age: p.age,
    gender: p.gender,
    village: p.village,
    phone: p.phone,
    totalVisits: p.totalVisits,
    registeredDate: p.registeredDate,
    synced: p.synced,
  })),
];

export function useDuplicateCheck(name: string, village: string) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const matchedPatient = useMemo(() => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedVillage = village.trim().toLowerCase();

    // Only run if user has typed at least 3 characters
    if (trimmedName.length < 3) {
      return null;
    }

    for (const p of ALL_KNOWN_PATIENTS) {
      const pName = p.fullName.toLowerCase();
      const pVillage = p.village.toLowerCase();

      // Check village match if village is provided
      const villageMatches = !trimmedVillage || pVillage.includes(trimmedVillage) || trimmedVillage.includes(pVillage);

      if (villageMatches) {
        // Direct substring check or Levenshtein distance <= 2
        if (pName === trimmedName || Math.abs(pName.length - trimmedName.length) <= 2) {
          const dist = levenshtein(trimmedName, pName);
          if (dist <= 2) {
            return p;
          }
        }
      }
    }

    return null;
  }, [name, village]);

  const isDismissed = matchedPatient ? matchedPatient.id === dismissedId : false;

  return {
    match: isDismissed ? null : matchedPatient,
    dismiss: () => {
      if (matchedPatient) {
        setDismissedId(matchedPatient.id);
      }
    },
    resetDismiss: () => setDismissedId(null),
  };
}
