import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "autoUpdate" means the service worker updates itself in the
      // background whenever a new build is deployed — the user never sees
      // a stuck/old version without needing a manual "refresh" step.
      registerType: "autoUpdate",

      // Static files in /public that should also be available offline
      // (icons, etc), alongside the built JS/CSS Vite already precaches.
      includeAssets: ["apple-touch-icon.png"],

      manifest: {
        name: "Shop Manager",
        short_name: "Shop Manager",
        description: "Manage products, sales, purchases, and stock for your shop.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#F8FAFC", // splash screen background (matches slate-50)
        theme_color: "#0F9C7F", // matches the app's brand teal (status bar / address bar color)
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // IMPORTANT: this app shows live business data — stock counts,
        // prices, today's sales. We only want the SHELL (JS/CSS/fonts/
        // icons) to be cached for fast/offline loading. We do NOT add any
        // runtime caching rule for "/api/..." requests, so every API call
        // always goes to the network and returns real, current data —
        // never a stale cached response. If the device is actually
        // offline, API calls simply fail and the app's existing
        // loading/error states handle that (same as before this was a PWA).
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});