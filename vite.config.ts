import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router", "react-router-dom"],
          mui: [
            "@emotion/react",
            "@emotion/styled",
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-date-pickers",
          ],
          i18n: ["i18next", "react-i18next"],
          bootstrap: ["bootstrap", "react-bootstrap-sidebar-menu"],
          forms: ["formik", "yup"],
          utilities: ["axios", "date-fns", "moment", "jwt-decode"],
        },
      },
    },
  },
})
