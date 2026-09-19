import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PatientResultRow } from '../components/PatientResultRow';
import { usePatientSearch } from '../features/patients/usePatientSearch';
import { Plus, Search, Users } from 'lucide-react';

export const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { results: filtered } = usePatientSearch(search, 'all');

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-text tracking-tight">
            Patients
          </h1>
          <p className="font-sans text-xs text-text-muted mt-1">
            Master patient register and clinical dossiers
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={() => navigate('/patients/new')}
        >
          New Patient
        </Button>
      </div>

      {/* Search filter */}
      <div className="relative flex items-center w-full max-w-md">
        <Search
          className="w-4 h-4 text-text-muted absolute left-3 pointer-events-none"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or village…"
          className="w-full h-9 pl-9 pr-3 bg-surface text-text text-sm rounded-sm border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent placeholder:text-text-faint transition-colors"
        />
      </div>

      {/* Patients list */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center bg-surface border border-border rounded-md">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2" strokeWidth={1.5} />
            <p className="font-serif text-md text-text mb-1">No matching patients</p>
            <p className="text-xs text-text-muted">Try a different search query.</p>
          </div>
        ) : (
          filtered.map((patient) => (
            <PatientResultRow key={patient.id} patient={patient} />
          ))
        )}
      </div>
    </div>
  );
};
