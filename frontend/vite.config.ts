import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        giveFeedback: 'giveFeedback.html',
        viewFeedback: 'viewFeedback.html',
        error: 'error.html'
      }
    }
  }
})