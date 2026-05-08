import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('monaco-editor') >= 0 || id.indexOf('@monaco-editor/react') >= 0) {
            return 'monaco-editor';
          }

          if (id.indexOf('node_modules/react') >= 0 || id.indexOf('node_modules/react-dom') >= 0 || id.indexOf('node_modules/zustand') >= 0) {
            return 'react-vendor';
          }

          if (id.indexOf('node_modules/antd') >= 0 || id.indexOf('node_modules/@ant-design') >= 0 || id.indexOf('node_modules/rc-') >= 0) {
            return 'antd-vendor';
          }

          if (id.indexOf('node_modules/react-dnd') >= 0 || id.indexOf('node_modules/dnd-core') >= 0) {
            return 'dnd-vendor';
          }
        },
      },
    },
  },
})
