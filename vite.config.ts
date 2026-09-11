import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from /<repo-name>/, so the build needs
// that base path — but only in CI, so `npm run dev`/`npm run build` locally
// still work at the root.
const base = process.env.GITHUB_PAGES === 'true' ? '/RD-STATION/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
});
