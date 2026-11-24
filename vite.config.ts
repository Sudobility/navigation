import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// import.meta.url (not __dirname): works under both Vite's legacy and "native" ESM config loaders.
const r = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

/**
 * Bundled library build (Rollup, via Vite's library mode): a single `dist/index.js`. This package
 * has no JSX and no React — it is the framework-agnostic navigation model — so no React plugin.
 * Declarations are generated separately by `tsconfig.build.json`'s `tsc --emitDeclarationOnly`
 * pass (see `package.json`'s `build` script), then `scripts/fix-esm-imports.mjs` fully-qualifies
 * the relative specifiers in the emitted `.d.ts` files for Node's native ESM resolver.
 */
export default defineConfig({
  build: {
    lib: {
      entry: r("src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // zustand is a peer dependency, provided by the consuming app; never bundled in.
      external: ["zustand", "zustand/vanilla"],
    },
    sourcemap: true,
    minify: false,
  },
});
