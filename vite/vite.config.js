import { defineConfig } from 'vite'
import hasty from './plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    hasty(),
    react({
      include: /\.(jsx|tsx|hsty)$/,
    }),
  ],
})
