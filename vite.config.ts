import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import { VitePWA } from "vite-plugin-pwa"
import mdx from "@mdx-js/rollup"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import path from "path"

const config = defineConfig(({ command }) => {
  const isBuild = command === "build"
  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      {
        name: "mdx-path-resolve",
        enforce: "pre",
        resolveId(id, importer) {
          if (id.startsWith("@/") && importer?.endsWith(".mdx")) {
            const resolved = path.resolve(__dirname, id.replace("@/", "src/"))
            if (resolved.endsWith(".tsx") || resolved.endsWith(".ts")) {
              return resolved
            }
            return resolved + ".tsx"
          }
          return null
        },
      },
      {
        enforce: "pre",
        ...mdx({
          remarkPlugins: [remarkFrontmatter, remarkGfm],
        }),
      },
      ...(isBuild && !process.env.VITEST
        ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
        : []),
      devtools(),
      tailwindcss(),
      tanstackStart(),
      VitePWA({
        strategies: "injectManifest",
        registerType: "autoUpdate",
        injectRegister: false,
        srcDir: "public",
        outDir: "dist/client",
        filename: "sw.js",
        manifest: false,
        selfDestroying: false,
      }),
      viteReact(),
    ],
  }
})

export default config
