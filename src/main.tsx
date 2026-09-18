import './globals';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { MidnightProvider } from './hooks/useMidnight';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MidnightProvider>
      <App />
    </MidnightProvider>
  </StrictMode>,
);
