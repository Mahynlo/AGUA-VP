import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['electron-context-menu'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@heroui/react': resolve('src/renderer/src/components/ui/heroui-bridge.jsx')
      }
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss()
        ]
      }
    },
    plugins: [
      react()
    ]
  }
})
