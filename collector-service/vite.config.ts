import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get port from environment variable or default to 8081 (Office)
  const port = env.VITE_PORT ? parseInt(env.VITE_PORT) : 8081;
  
  return {
    server: {
      host: "::",
      port: port,
    },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Add environment-specific configurations
    define: {
      __SERVICE_TYPE__: JSON.stringify(env.VITE_SERVICE_TYPE || 'office'),
    },
    // Ensure environment variables are loaded
    envDir: process.cwd(),
  };
});
