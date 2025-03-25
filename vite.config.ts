import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { TDesignResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import path from 'path'
import projectConfig from './project.config.ts'
import type { MonkeyOption } from 'vite-plugin-monkey'
import deepmerge from 'deepmerge'
// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  console.log(mode)
  if (!mode) {
    throw new Error('mode is required')
  }
  const config = projectConfig[mode as keyof typeof projectConfig] as MonkeyOption
  if (!config) {
    throw new Error(`config ${mode} not found`)
  }
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      emptyOutDir: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // 将 monaco-editor 单独打包
            'monaco-editor': ['monaco-editor'],
          },
        },
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', util.unimportPreset],
        resolvers: [
          TDesignResolver({
            library: 'vue-next',
          }),
        ],
        dirs: ['utils', 'hooks'],
        dts: 'auto-imports.d.ts',
      }),
      Components({
        dts: 'components.d.ts',
        dirs: ['components'],
        resolvers: [
          TDesignResolver({
            library: 'vue-next',
          }),
        ],
      }),
      monkey(
        deepmerge(
          {
            server: {
              mountGmApi: true,
            },
            entry: '',
            build: {
              fileName: 'default.user.js',
              // externalGlobals: {
              //   'tdesign-vue-next': cdn.bytecdntp('tdesign-vue-next', 'dist/tdesign.js'),
              //   vue: cdn.bytecdntp('Vue', 'dist/vue.global.prod.js'),
              // },
            },
          },
          config,
        ),
      ),
    ],
  }
})
