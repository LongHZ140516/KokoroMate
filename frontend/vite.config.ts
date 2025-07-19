import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path";
import { defineConfig, normalizePath } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      // input: normalizePath(resolve(__dirname, "src/index.html")),
      input: normalizePath(resolve(__dirname, "index.html")),
      output: {
          entryFileNames: "index.js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
          // https://rollupjs.org/configuration-options/#output-manualchunks
          manualChunks: (id) => {
              if (id.includes("Shaders/")) {
                  return "glslShaders";
              } else if (id.includes("ShadersWGSL/")) {
                  return "wgslShaders";
              }
              return null;
          }
      }
  },
  modulePreload: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
  },
  optimizeDeps: {
    exclude: [
      // see https://github.com/vitejs/vite/issues/8427
      "@babylonjs/core",
      "@babylonjs/havok",
      "babylon-mmd"
  ]
  }
})