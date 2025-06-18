import type { MonkeyOption } from 'vite-plugin-monkey'
const config: MonkeyOption = {
  entry: './packages/copy-multi-zentao-bug-id/index.ts',
  userscript: {
    version: '0.0.1',
    'run-at': 'document-idle' as const,
    require: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
    match: ['http://pms.seevin.com/company-dynamic-account-*.html', 'http://pms.seevin.com/my/'],
    description: '批量复制已解决bug的禅道bug id',
    license: 'MIT',
    name: 'copy-multi-zentao-bug-id',
  },
  build: {
    fileName: 'copy-multi-zentao-bug-id.js',
  },
}
export default config
