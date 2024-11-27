import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd());
  const comfyUrl = env.VITE_COMFY_HTTP;

  if (mode === 'production') {
    console.log('Comfy URL:', comfyUrl);
    return {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
      plugins: [react()],
    };
  } else {
    console.log('Comfy URL:', comfyUrl);
    return {
      server: {
        proxy: {
          '/api': {
            target: comfyUrl,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            secure: true,
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('Proxying request:', {
                  comfyUrl: comfyUrl,
                  target: proxyReq.getHeader('host'),
                  path: proxyReq.path,
                  req_header_host: req.headers.host,
                  req_header_origin: req.headers.origin,
                  req_header_referer: req.headers.referer,
                  res: res.statusCode
                });
              });
            }
          },
        },
      },
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
      plugins: [react()],
    };
  };
});
