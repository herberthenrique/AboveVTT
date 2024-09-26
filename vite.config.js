import { resolve } from 'path';
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { globSync } from 'glob';
import { fileURLToPath } from 'node:url';

import manifest from './manifest.json';

const root = resolve(__dirname, '.');
const outDir = resolve(__dirname, 'dist');

const isDev = process.env.__DEV__ === 'true';

const extensionManifest = {
  ...manifest,
  name: isDev ? `DEV: ${manifest.name}` : manifest.name,
};

const getResourcesFromManifest = () => {
  return extensionManifest.web_accessible_resources[0].resources;
};

const formatFiles = (file) => {
  const entry = fileURLToPath(new URL(file, import.meta.url));
  return entry.replace(import.meta.dirname, '.')
};

const formatFilesFromFolder = (folder) => {
  return globSync(folder).map((file) => formatFiles(file));
};

const invalidFolders = ['assets/*', 'audio/*', 'images/*', 'font/*'];

const inputEntries = getResourcesFromManifest().reduce((previous, current) => {
  if (invalidFolders.includes(current)) {
    return previous;
  }

  if (current.includes('/*')) {
    return [...previous, ...formatFilesFromFolder(current)];
  }
  return [...previous, formatFiles(current)];
}, []);


console.log('inputEntries: ', inputEntries);

export default defineConfig({
  root,
  esbuild: {
    minifyIdentifiers: false,
  },

  resolve: {
    alias: {
      '@src': root,
    },
  },
  plugins: [
    crx({
      manifest: extensionManifest,
      contentScripts: {
        injectCss: true,
      },
    }),
  ],
  build: {
    outDir,
    rollupOptions: {
      input: inputEntries,
      treeshake: false,
    },
    sourcemap: isDev,
    emptyOutDir: !isDev,
    minify: false
  },
});
