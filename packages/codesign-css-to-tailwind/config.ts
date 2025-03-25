import type { MonkeyOption } from 'vite-plugin-monkey'
const config: MonkeyOption = {
  entry: './packages/codesign-css-to-tailwind/index.ts',
  userscript: {
    'run-at': 'document-idle' as const,
    require: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
    match: ['https://codesign.qq.com/app/design/*'],
    description: '将css转换为tailwind代码',
    license: 'MIT',
    name: 'codesign-css-transform',
  },
  build: {
    fileName: 'codesign-css-gen.user.js',
  },
}
export default config
