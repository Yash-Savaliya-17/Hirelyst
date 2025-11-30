import path from "path"
import react from "@vitejs/plugin-react-swc"
import {defineConfig} from "vite"
import Unfonts from 'unplugin-fonts/vite'

export default defineConfig({
  plugins: [react(), Unfonts({
    custom: {
      families: [
        {
          name: 'Geist',
          src: './src/assets/fonts/geist/*.woff2',
        },
      ],
    },
  }),],
  server: {
    proxy: {
      '/api/auth': 'http://37.27.81.8:3000',
      '/api/quiz': 'http://37.27.81.8:3000',
      '/api/interview': 'http://37.27.81.8:3000',
      // '/parse-resume': 'http://37.27.81.8:3001'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist', // Ensure the correct output directory
    sourcemap: false, // Disable sourcemaps in production
    minify: 'esbuild', // Use esbuild for faster builds
    assetsInlineLimit: 4096, // Inline assets below 4KB
  },
})
