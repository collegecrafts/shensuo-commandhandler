import { defineConfig } from 'tsup';

export default defineConfig({
    dts: true,
    target: 'esnext',
    clean: true,
    outDir: 'dist',
    format: ['cjs', 'esm'],
    skipNodeModulesBundle: true,
    entryPoints: ['src/index.ts'],
    minify: false,
    bundle: true,
    splitting: true,
});
