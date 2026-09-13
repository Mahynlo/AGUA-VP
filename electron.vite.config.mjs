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
        '@renderer': resolve('src/renderer/src')
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
