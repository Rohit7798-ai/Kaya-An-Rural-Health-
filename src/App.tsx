import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Login } from './routes/Login';
import { Today } from './routes/Today';
import { Patients } from './routes/Patients';
import { PatientProfile } from './routes/PatientProfile';
import { NewPatient } from './routes/NewPatient';
import { Visits } from './routes/Visits';
import { VisitDetail } from './routes/VisitDetail';
import { NewVisit } from './routes/NewVisit';
import { Reports } from './routes/Reports';
import { Settings } from './routes/Settings';
import { Sync } from './routes/Sync';
import { AttachmentViewer } from './routes/AttachmentViewer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Screen 1: Login (No AppShell top bar or sidebar on this route) */}
        <Route path="/login" element={<Login />} />

        {/* Protected App Routes inside 64px Topbar + 240px Sidebar AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<NewPatient />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/visits/new" element={<NewVisit />} />
          <Route path="/visits/:id" element={<VisitDetail />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/attachments/:id" element={<AttachmentViewer />} />
        </Route>

        {/* Fallback to today */}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
