import type { MonkeyOption } from 'vite-plugin-monkey'

const config: MonkeyOption = {
  entry: './packages/dify-ai-gen-code-embed/index.ts',
  userscript: {
    version: '0.0.1',
    'run-at': 'document-idle' as const,
    match: ['http://api.seevin.com/*'],
    description: 'Dify AI 代码生成嵌入脚本',
    license: 'MIT',
    name: 'dify-ai-gen-code-embed',
    grant: ['GM_xmlhttpRequest', 'GM_addStyle', 'GM_setValue', 'GM_getValue'],
    connect: ['udify.app', '*.udify.app'],
    require: ['https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js'],
  },
  build: {
    fileName: 'dify-ai-gen-code-embed.user.js',
  },
}

export default config
