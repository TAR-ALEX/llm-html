import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import svgLoader from 'vite-svg-loader'

export default defineConfig({
  plugins: [react(), svgLoader(), viteSingleFile()],
  build: {
    outDir: 'dist', // Output directory
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
  server:{
    allowedHosts: true // Warning: this is for debug only
  }
});
