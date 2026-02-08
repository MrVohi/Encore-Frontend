import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { fileURLToPath, URL } from "node:url"
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://192.168.1.17:8080"

  const hasSentryCI =
    Boolean(process.env.SENTRY_AUTH_TOKEN) &&
    Boolean(process.env.SENTRY_ORG) &&
    Boolean(process.env.SENTRY_PROJECT)

  return {
    plugins: [
      devtools(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      viteReact(),
      tailwindcss(),

      // CI-only: upload sourcemaps to Sentry when secrets exist.
      ...(hasSentryCI
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG!,
              project: process.env.SENTRY_PROJECT!,
              authToken: process.env.SENTRY_AUTH_TOKEN!,
              // Optional (recommended later): set a release in CI
              release: process.env.SENTRY_RELEASE,
            }),
          ]
        : []),
    ],

    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },

    build: { sourcemap: Boolean(process.env.SENTRY_AUTH_TOKEN) },

    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  }
})
