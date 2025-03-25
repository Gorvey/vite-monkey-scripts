<script setup lang="ts">
import { LayerData } from '../types'

const props = defineProps<{
  layerData: LayerData
}>()
const localLayerData = ref<LayerData | null>(null)
const { data: activePanel } = useMonkeyStorage<string | number>({
  key: 'codesign-css-to-tailwind-active-panel',
  defaultValue: 0,
})
const { data: panelList } = useMonkeyStorage<{ label: string; value: number; code: string }[]>({
  key: 'codesign-css-to-tailwind-panels',
  defaultValue: [],
})
const activeCssVariable = computed(() => {
  if (!panelList.value?.length) return ''
  return panelList.value[Number(activePanel.value)].code
})
watch(
  () => props.layerData,
  (newValue) => {
    localLayerData.value = toValue(newValue)
  },
  { deep: true, immediate: true },
)
const tailwindCode = computed(() => {
  return cssToTailwind(localLayerData.value?.css ?? [])
})
const formatedCssVariableTailwindCode = computed(() => {
  if (!activeCssVariable.value) return tailwindCode.value

  // 解析CSS变量定义
  const cssVarRegex = /--([^:]+):\s*([^;]+);/g
  const cssVars: Record<string, string> = {}
  let match

  while ((match = cssVarRegex.exec(activeCssVariable.value)) !== null) {
    const varName = match[1].trim()
    const varValue = match[2].trim()
    cssVars[varValue.toLowerCase()] = `var(--${varName})`
  }

  // 替换tailwindCode中的颜色值
  let result = tailwindCode.value

  // 匹配Tailwind中的颜色值模式 [#xxxxxx] 或 [rgba(x,x,x,x)]
  const colorRegex = /\[(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\]/g

  result = result.replace(colorRegex, (match) => {
    // 提取颜色值 (去掉方括号)
    const colorValue = match.substring(1, match.length - 1).toLowerCase()

    // 检查是否有对应的CSS变量
    if (cssVars[colorValue]) {
      return `[${cssVars[colorValue]}]`
    }

    return match
  })

  return result
})
defineExpose({
  activeCssVariable,
  tailwindCode,
  formatedCssVariableTailwindCode,
  localLayerData,
})
</script>

<template>
  <div class="css-node">
    <input readonly :value="formatedCssVariableTailwindCode" class="tailwind-code-area" />
  </div>
</template>

<style>
.css-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tailwind-code-area {
  padding: 5px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 32px;
  max-height: 190px;
  overflow: auto;
  border-radius: 4px;
  cursor: text;
  background: rgba(0, 0, 0, 0.04);
  width: 100%;
}
</style>
