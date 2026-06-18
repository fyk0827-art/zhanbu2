import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

function wasmMimeType(): Plugin {
  return {
    name: "wasm-mime-type",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0].endsWith(".wasm")) {
          res.setHeader("Content-Type", "application/wasm")
        }
        next()
      })
    },
  }
}

export default defineConfig({
  base: "/",
  plugins: [wasmMimeType(), react()],
  server: {
    host: true,
    port: 3030,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8880",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 3030,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8880",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.wasm"],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    minify: "terser",
    terserOptions: {
      mangle: {
        reserved: [
          "_malloc", "_free", "ccall", "cwrap", "getValue", "setValue",
          "UTF8ToString", "allocateUTF8", "stackAlloc", "stackSave", "stackRestore",
          "lengthBytesUTF8", "stringToUTF8", "FS",
        ],
      },
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  optimizeDeps: {
    exclude: ["@swisseph/browser", "@swisseph/core"],
  },
})
