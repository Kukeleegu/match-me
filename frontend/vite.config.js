import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 1) Plugins
  plugins: [
    react(),   // Enables React Fast Refresh and JSX support
  ],

  // 2) Server options
  server: {
    port: 3000,          // The port the Vite dev server runs on (default is 3000)
    open: true,          // Automatically opens http://localhost:3000 in your browser
    proxy: {
      // Proxy any request starting with /api to the Spring Boot server
      '/api': {
        target: 'http://localhost:8080',  // Your backend URL
        changeOrigin: true,               // Make the host header of the request match the target
        secure: false,                    // Allow self-signed certificates (if you ever use HTTPS locally)
        // Optional: rewrite the path before sending it to the backend
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },

  define: {
    global: 'window',
  },

});
