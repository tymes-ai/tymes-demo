import '@fontsource-variable/jost';
import {ClerkProvider} from '@clerk/react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import {AuthGate} from './auth/AuthGate';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AuthGate>
        <App />
      </AuthGate>
    </ClerkProvider>
  </StrictMode>,
);
