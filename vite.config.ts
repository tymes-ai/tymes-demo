import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// Relative base: the built folder works from any host or subpath.
export default defineConfig({base: './', plugins: [react()]});
