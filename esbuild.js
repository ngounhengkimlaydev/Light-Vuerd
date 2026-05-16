const esbuild = require('esbuild')

const watch = process.argv.includes('--watch')

const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  platform: 'node',
  format: 'cjs',
  sourcemap: true
}

if (watch) {
  esbuild.context(config).then(ctx => ctx.watch())
} else {
  esbuild.build(config).catch(() => process.exit(1))
}