import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { BrainProvider } from './BrainContext.tsx';
import { AuthProvider } from './AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrainProvider>
        <App />
      </BrainProvider>
    </AuthProvider>
  </StrictMode>,
);

