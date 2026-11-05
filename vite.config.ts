import react from '@vitejs/plugin-react';
import {defineConfig, loadEnv} from 'vite';

// Relative base: the built folder works from any host or subpath.
export default defineConfig(({command, mode}) => {
  // Fail the build, so a missing key can't deploy a site that won't load.
  if (command === 'build' && !loadEnv(mode, process.cwd()).VITE_CLERK_PUBLISHABLE_KEY) {
    throw new Error('Set VITE_CLERK_PUBLISHABLE_KEY. See the README.');
  }
  return {base: './', plugins: [react()]};
});
