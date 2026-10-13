import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发期：Vite dev server 通过代理把 /ws 转发到本地 Spring Boot（8080）。
// 构建期：产物输出到后端静态资源目录，由 Spring Boot 托管。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  build: {
    outDir: '../src/main/resources/static',
    emptyOutDir: true,
  },
})
