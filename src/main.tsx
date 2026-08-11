import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { BrainProvider } from './BrainContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrainProvider>
      <App />
    </BrainProvider>
  </StrictMode>,
);

