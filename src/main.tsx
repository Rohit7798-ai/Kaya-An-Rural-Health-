import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles/tokens.css';
import './index.css';
import App from './App.tsx';
import { db } from './lib/db';
import { seedDevDatabase } from './lib/devSeed';

// Development seed for Dexie client database
if (import.meta.env.DEV) {
  db.patients.count().then((count) => {
    if (count === 0) {
      seedDevDatabase();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

