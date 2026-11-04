import '@fontsource-variable/jost';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    <App />
  </StrictMode>,
);
