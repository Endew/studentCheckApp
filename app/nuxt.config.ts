import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' }, // ปิด/เปิด DevTools จาก .env
  buildDir: '.nuxt',
  nitro: {
    output: {
      publicDir: 'dist'
    },
    devProxy: {
      "/api/": {
        target: process.env.NUXT_API_URL || "http://localhost:3001", // ใช้ค่าจาก .env
        changeOrigin: true
      }
    }
  },
  
  build: {
    transpile: ['vuetify'],
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      "name": process.env.NUXT_APP_NAME || "แอพเช็คชื่อเทคนิคชัยภูมิ",
      "short_name": process.env.NUXT_APP_SHORT_NAME || "เช็คชื่อเทคนิคชัยภูมิ",
      "start_url": "/",
      "display": "standalone",
      "background_color": process.env.NUXT_THEME_COLOR || "#71c9f4",
      "theme_color": process.env.NUXT_THEME_COLOR || "#71c9f4",
      "icons": [
        {
          "src": "/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    }
  },

  css: [
    'vuetify/styles', // CSS styles for Vuetify
    '@mdi/font/css/materialdesignicons.min.css', // Material Design Icons (if using)
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  devServer: {
    // https: {
    //   key: process.env.NUXT_SSL_KEY || './ssl/key.pem',
    //   cert: process.env.NUXT_SSL_CERT || './ssl/cert.pem'
    // },
    host: '0.0.0.0',
    port: Number(process.env.NUXT_PORT) || 3002
  },
  
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_API_BASE || '/api'
    }
  },

  compatibilityDate: '2024-11-07',
})