<!--
 * @Author: zengzhe
 * @Date: 2026-01-22 11:48:42
 * @LastEditors: zengzhe
 * @LastEditTime: 2026-01-22 14:58:00
 * @Description: 
-->
<script setup lang="ts">
import { LayerData } from '../types'
import {
  replaceCssVariablesInTailwind,
  getCssReplaceResults,
  type CssReplaceResult,
} from '../../../utils/cssVariableReplacer'

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
/**
 * 获取当前激活的 CSS 变量配置
 */
const activeCssVariable = computed(() => {
  if (!panelList.value?.length) return ''
  return panelList.value[Number(activePanel.value)].code
})

watch(
  () => props.layerData,
  (newValue) => {
    console.log('codeapp layerData change', newValue)
    localLayerData.value = toValue(newValue)
  },
  { deep: true, immediate: true },
)

/**
 * 将图层的 CSS 转换为 Tailwind 类名
 */
const tailwindCode = computed(() => {
  return cssToTailwind(localLayerData.value?.css ?? [])
})

/**
 * 将 Tailwind 代码中的颜色值替换为 CSS 变量
 */
const formatedCssVariableTailwindCode = computed(() => {
  return replaceCssVariablesInTailwind(tailwindCode.value, activeCssVariable.value)
})

/**
 * 获取 CSS 变量替换结果详情列表（只返回有匹配的颜色）
 */
const cssReplaceResults = computed((): CssReplaceResult[] => {
  return getCssReplaceResults(localLayerData.value?.css ?? [], activeCssVariable.value)
})

/**
 * 是否有 CSS 变量配置
 */
const hasCssVariableConfig = computed(() => {
  return Boolean(activeCssVariable.value.trim())
})

/**
 * 打开 CSS 变量设置弹窗
 */
const openSettings = () => {
  window.dispatchEvent(new CustomEvent('open-css-variable-settings'))
}

/**
 * 复制文本到剪贴板
 */
const copyText = (text: string) => {
  copyToClipboard(text)
  message.success('已复制')
}

/**
 * 复制 class 格式
 */
const copyClassFormat = () => {
  const classStr = `class="${formatedCssVariableTailwindCode.value}"`
  copyToClipboard(classStr)
  message.success('已复制 class')
}

defineExpose({
  activeCssVariable,
  tailwindCode,
  formatedCssVariableTailwindCode,
  localLayerData,
})
</script>

<template>
  <div>
    <div
      class="section"
      @click="
        copyText(`---
type: ${localLayerData?.type}
name: ${localLayerData?.name}
---`)
      "
    >
      <div class="replace-item">
        <div class="replace-item-left">type:</div>
        <div class="replace-item-right">{{ localLayerData?.type }}</div>
      </div>
      <div class="replace-item">
        <div class="replace-item-left">name:</div>
        <div class="replace-item-right">{{ localLayerData?.name }}</div>
      </div>
    </div>
    <!-- CSS 变量替换列表 -->
    <div class="section">
      <div class="section-title">颜色变量</div>
      <div class="replace-list-container">
        <div v-if="!hasCssVariableConfig" class="empty-tip">未配置 CSS 变量</div>
        <div v-else-if="cssReplaceResults.length === 0" class="empty-tip-row">
          <span class="empty-tip">未找到匹配的颜色变量</span>
          <button @click="openSettings" class="settings-btn">配置</button>
        </div>
        <div v-else class="replace-list">
          <div v-for="(item, index) in cssReplaceResults" :key="index" class="replace-item">
            <div class="replace-item-left">
              <span class="replace-value">{{ item.original }}</span>
            </div>
            <div>-></div>
            <div class="replace-item-right">
              <span
                class="replace-value"
                :class="{ replaced: item.hasMatch, clickable: item.hasMatch, unmatched: !item.hasMatch }"
                @click="item.hasMatch && copyText(item.replaced)"
                >{{ item.replaced }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Tailwind 代码 -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Tailwind CSS</div>
        <button @click="copyClassFormat" class="copy-class-btn">class=""</button>
      </div>
      <div class="css-node">
        <div @click="copyText(formatedCssVariableTailwindCode)" readonly class="tailwind-code-area">
          {{ formatedCssVariableTailwindCode }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.section {
  margin-bottom: 12px;
  margin-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--td-text-color-primary, #333);
  margin: 0 0 8px;
}

.replace-list-container {
  margin-top: 0;
  margin-bottom: 0;
  max-height: 200px;
  /* overflow-y: auto; */
}

.empty-tip-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-tip {
  padding: 8px 12px;
  color: var(--td-text-color-placeholder, #999);
  font-size: 12px;
  text-align: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  flex: 1;
}

.settings-btn {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--td-brand-color, #0052d9);
  background: transparent;
  border: 1px solid var(--td-brand-color, #0052d9);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  color: #fff;
  background: var(--td-brand-color, #0052d9);
}

.replace-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.replace-item {
  display: flex;
  /* flex-direction: column; */
  gap: 4px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
}

.replace-item-left,
.replace-item-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.replace-label {
  flex-shrink: 0;
  color: var(--td-text-color-secondary, #666);
  font-size: 11px;
}

.replace-value {
  color: var(--td-text-color-primary, #333);
  word-break: break-all;
}

.replace-value.replaced {
  color: var(--td-brand-color, #0052d9);
  font-weight: 500;
}

.replace-value.unmatched {
  color: var(--td-text-color-placeholder, #999);
  font-style: italic;
}

.replace-value.clickable {
  cursor: pointer;
  transition: opacity 0.2s;
}

.replace-value.clickable:hover {
  opacity: 0.7;
}

.replace-value.clickable:active {
  opacity: 0.5;
}

.replace-arrow {
  text-align: center;
  color: var(--td-text-color-placeholder, #999);
  font-size: 12px;
}

.css-node {
  /* class 按钮已移到标题行 */
}

.copy-class-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: var(--td-text-color-primary, #333);
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.copy-class-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.copy-class-btn:active {
  background: rgba(0, 0, 0, 0.12);
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
