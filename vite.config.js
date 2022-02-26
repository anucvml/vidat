import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { QuasarResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    open: true
  },
  publicDir: 'src/public',
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    Components({
      resolvers: [
        QuasarResolver()
      ]
    }),
    quasar({
      autoImportComponentCase: 'pascal'
    }),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json']
    })
  ],
  define: {
    PACKAGE_VERSION: JSON.stringify(process.env.npm_package_version)
  }
})
