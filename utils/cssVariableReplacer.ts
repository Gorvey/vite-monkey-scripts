/**
 * CSS 变量替换工具函数
 * 用于将 CSS 中的颜色值替换为 CSS 变量
 */

/**
 * 颜色值格式
 */
interface ColorValue {
  r: number
  g: number
  b: number
  a: number
}

/**
 * CSS 变量映射条目
 */
interface CssVarEntry {
  color: ColorValue
  varName: string
}

/**
 * 解析 CSS 颜色值为 RGB 对象
 * @param colorStr - 颜色字符串，如 rgba(0, 0, 0, 0.4)、rgb(255, 255, 255)、#fff、#ffffff
 * @returns RGB 对象，解析失败返回 null
 */
const parseColorValue = (colorStr: string): ColorValue | null => {
  const trimmed = colorStr.trim().toLowerCase()

  // 匹配 rgba(r, g, b, a)
  const rgbaMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    }
  }

  // 匹配 #fff 或 #ffffff
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/)
  if (hexMatch) {
    let hex = hexMatch[1]
    // 扩展简写形式 #fff -> #ffffff
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
      a: hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1,
    }
  }

  return null
}

/**
 * 比较两个颜色值是否相等
 * @param color1 - 颜色值1
 * @param color2 - 颜色值2
 * @param tolerance - 容差值，用于处理浮点数精度问题
 * @returns 是否相等
 */
const areColorsEqual = (color1: ColorValue, color2: ColorValue, tolerance: number = 0.01): boolean => {
  return (
    Math.abs(color1.r - color2.r) < 1 &&
    Math.abs(color1.g - color2.g) < 1 &&
    Math.abs(color1.b - color2.b) < 1 &&
    Math.abs(color1.a - color2.a) < tolerance
  )
}

/**
 * 解析 CSS 变量定义字符串
 * @param cssVariableCode - CSS 变量定义字符串，如 :root { --color: #fff; }
 * @returns CSS 变量条目数组
 */
const parseCssVariables = (cssVariableCode: string): CssVarEntry[] => {
  const cssVarRegex = /--([^:]+):\s*([^;]+);/g
  const entries: CssVarEntry[] = []
  let match

  while ((match = cssVarRegex.exec(cssVariableCode)) !== null) {
    const varName = match[1].trim()
    const varValue = match[2].trim()
    const color = parseColorValue(varValue)

    if (color) {
      entries.push({
        color,
        varName,
      })
    }
  }

  return entries
}

/**
 * 在颜色列表中查找匹配的 CSS 变量名
 * @param targetColor - 目标颜色值
 * @param cssVarEntries - CSS 变量条目数组
 * @returns 匹配的 CSS 变量名，未匹配返回 null
 */
const findMatchingCssVar = (targetColor: ColorValue, cssVarEntries: CssVarEntry[]): string | null => {
  for (const entry of cssVarEntries) {
    if (areColorsEqual(targetColor, entry.color)) {
      return `var(--${entry.varName})`
    }
  }
  return null
}

/**
 * 从 CSS 样式字符串中提取颜色值并替换为 CSS 变量
 * @param cssStr - CSS 样式字符串，如 "color: rgba(0, 0, 0, 0.4);"
 * @param cssVarEntries - CSS 变量条目数组
 * @returns 替换后的 CSS 样式字符串
 */
const replaceColorInCss = (cssStr: string, cssVarEntries: CssVarEntry[]): string => {
  // 匹配各种颜色格式
  const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g

  return cssStr.replace(colorRegex, (colorMatch) => {
    const color = parseColorValue(colorMatch)
    if (color) {
      const cssVarName = findMatchingCssVar(color, cssVarEntries)
      if (cssVarName) {
        return cssVarName
      }
    }
    return colorMatch
  })
}

/**
 * 从 Tailwind 代码字符串中提取颜色值并替换为 CSS 变量
 * @param tailwindCode - Tailwind 代码字符串，如 "text-[#fff] bg-[rgba(0,0,0,0.4)]"
 * @param cssVarEntries - CSS 变量条目数组
 * @returns 替换后的 Tailwind 代码字符串
 */
const replaceColorInTailwind = (tailwindCode: string, cssVarEntries: CssVarEntry[]): string => {
  // 匹配 Tailwind 中的颜色值模式 [#xxxxxx] 或 [rgba(x,x,x,x)]
  const colorRegex = /\[(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\]/g

  return tailwindCode.replace(colorRegex, (match) => {
    const colorValue = match.substring(1, match.length - 1)
    const color = parseColorValue(colorValue)
    if (color) {
      const cssVarName = findMatchingCssVar(color, cssVarEntries)
      if (cssVarName) {
        return `[${cssVarName}]`
      }
    }
    return match
  })
}

/**
 * 解析 CSS 变量并替换 CSS 数组中的颜色值
 * @param cssArray - CSS 样式数组
 * @param cssVariableCode - CSS 变量定义字符串
 * @returns 替换后的 CSS 样式数组
 */
export const replaceCssVariablesInArray = (cssArray: string[], cssVariableCode: string): string[] => {
  if (!cssVariableCode) return cssArray

  const cssVarEntries = parseCssVariables(cssVariableCode)

  return cssArray.map((cssItem) => replaceColorInCss(cssItem, cssVarEntries))
}

/**
 * 解析 CSS 变量并替换 Tailwind 代码中的颜色值
 * @param tailwindCode - Tailwind 代码字符串
 * @param cssVariableCode - CSS 变量定义字符串
 * @returns 替换后的 Tailwind 代码字符串
 */
export const replaceCssVariablesInTailwind = (tailwindCode: string, cssVariableCode: string): string => {
  if (!cssVariableCode) return tailwindCode

  const cssVarEntries = parseCssVariables(cssVariableCode)
  return replaceColorInTailwind(tailwindCode, cssVarEntries)
}

/**
 * CSS 变量替换结果
 */
export interface CssReplaceResult {
  original: string
  replaced: string
  hasMatch: boolean
}

/**
 * 单个颜色替换详情
 */
interface ColorReplaceDetail {
  originalColor: string
  replacedVar: string | null
}

/**
 * 获取 CSS 样式中的颜色替换详情
 * @param cssArray - CSS 样式数组
 * @param cssVariableCode - CSS 变量定义字符串
 * @returns 替换结果详情数组（包含所有颜色，匹配和未匹配的）
 */
export const getCssReplaceResults = (cssArray: string[], cssVariableCode: string): CssReplaceResult[] => {
  const results: CssReplaceResult[] = []

  if (!cssVariableCode) {
    return results
  }

  const cssVarEntries = parseCssVariables(cssVariableCode)
  if (cssVarEntries.length === 0) {
    return results
  }

  const colorRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g

  for (const cssItem of cssArray) {
    let match

    // 重置正则表达式的 lastIndex
    colorRegex.lastIndex = 0

    while ((match = colorRegex.exec(cssItem)) !== null) {
      const colorMatch = match[0]
      const color = parseColorValue(colorMatch)

      if (color) {
        const cssVarName = findMatchingCssVar(color, cssVarEntries)
        results.push({
          original: colorMatch,
          replaced: cssVarName || '未匹配',
          hasMatch: !!cssVarName,
        })
      }
    }
  }

  return results
}

export default {
  replaceCssVariablesInArray,
  replaceCssVariablesInTailwind,
  getCssReplaceResults,
}
