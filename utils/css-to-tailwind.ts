/*
 * @Author: zengzhe
 * @Date: 2025-03-24 11:15:35
 * @LastEditors: zengzhe
 * @LastEditTime: 2026-01-22 14:42:26
 * @Description:
 */
/**
 * 
 * @param css 
 * [
  "width: 440px;",
  "height: 68px;",
  "background: transparent;",
  "border: 1px solid #e1e3e5;"
]
 */
type CSSRule = [string, string | ((value: string) => string)]
const rules: CSSRule[] = [
  // ['width', 'w-[#]'],
  // ['height', 'h-[#]'],
  ['font-size', 'text-[#]'],
  // ['font-style', '#'],
  [
    'font-weight',
    (value: string) => {
      const maps: Record<string, string> = {
        '300': 'font-light',
        '400': 'font-normal',
        '500': 'font-medium',
        '600': 'font-semibold',
        '700': 'font-bold',
        '800': 'font-extrabold',
      }
      return maps[value]
    },
  ],
  ['color', 'text-[#]'],
  ['line-height', 'leading-[#]'],
  ['border-radius', 'rounded-[#]'],
  [
    'border',
    (value: string) => {
      const [width, style, color] = value.split(' ')
      return `border-[${width}] border-${style} border-[${color}]`
    },
  ],
  ['letter-spacing', 'tracking-[#]'],
  ['opacity', (value: string) => `opacity-${Math.round(parseFloat(value) * 100)}`],
  // ['text-decoration', '#'],
  // ['text-align', 'text-#'],
  ['background', 'bg-[#]'],
  // ['padding', 'p-[#]'],
  // ['margin', 'm-[#]'],
  // ['display', '#'],
  // ['position', '#'],
  // ['top', 'top-[#]'],
  // ['left', 'left-[#]'],
  // ['right', 'right-[#]'],
  // ['bottom', 'bottom-[#]'],
]
const cssToTailwind = (css: string[]): string => {
  // 将 CSS 字符串数组转换为属性-值对
  const cssProperties = css.map((item) => {
    const [prop, ...values] = item.split(':').map((s) => s.trim())
    return [prop, values.join(':').replace(';', '')]
  })

  const result = cssProperties
    .map(([prop, value]) => {
      const rule = rules.find(([cssName]) => cssName === prop)
      if (value === '') return null
      if (!rule) return null

      const [, template] = rule
      if (typeof template === 'function') {
        return template(value)
      }

      return template.replace('#', value)
    })
    .filter((item): item is string => {
      if (!item) return false
      const defaultValues = ['font-normal', 'text-[14px]', 'tracking-[0]']
      return !defaultValues.includes(item)
    })

  return result.join(' ')
}

export default cssToTailwind
