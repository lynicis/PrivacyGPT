import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import mdx from "@mdx-js/rollup"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"

const config = defineConfig(({ command }) => {
  const isBuild = command === "build"
  return {
    resolve: { tsconfigPaths: true },
    plugins: [
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
      viteReact(),
    ],
  }
})

export default config
