<script setup lang="ts">
import { waitElement } from '../../../utils/waitElement'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { message } from '../../../utils/message'
import { replaceCssVariablesInArray } from '../../../utils/cssVariableReplacer'
import type { LayerData } from '../types'

/**
 * 检查一个矩形是否完全包含另一个矩形
 */
const isRectContained = (
  outer: { x: number; y: number; width: number; height: number },
  inner: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  )
}

/**
 * 需要过滤的 CSS 属性
 */
const CSS_FILTER_PROPERTIES = ['font-family', 'text-align']

/**
 * 获取当前激活的 CSS 变量配置
 */
const getActiveCssVariable = (): string => {
  const { data: activePanel } = useMonkeyStorage<string | number>({
    key: 'codesign-css-to-tailwind-active-panel',
    defaultValue: 0,
  })
  const { data: panelList } = useMonkeyStorage<{ label: string; value: number; code: string }[]>({
    key: 'codesign-css-to-tailwind-panels',
    defaultValue: [],
  })
  if (!panelList.value?.length) return ''
  return panelList.value[Number(activePanel.value)].code || ''
}

/**
 * 格式化图层数据用于HTML生成
 * @param layers - 图层数据数组
 * @returns 格式化后的图层数据
 */
const formatLayersForHtmlGeneration = (layers: LayerData[]) => {
  const activeCssVariable = getActiveCssVariable()

  return layers
    .filter((layer) => {
      return !layer?.css?.includes('background: transparent;')
    })
    .map((layer) => {
      let filteredCss = layer.css?.filter((cssItem) => {
        const trimmed = cssItem.trim()
        return !CSS_FILTER_PROPERTIES.some((prop) => trimmed.startsWith(prop))
      })

      // CSS 变量替换
      if (filteredCss && activeCssVariable) {
        filteredCss = replaceCssVariablesInArray(filteredCss, activeCssVariable)
      }

      return {
        type: layer.type,
        name: layer.name,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        css: filteredCss,
        content: layer?.content || '',
      }
    })
}

/**
 * 获取当前图层及其包含的所有图层数据
 */
const getLayerDatas = async () => {
  console.log('getLayerDatas')
  const layerData = (await waitElement('.screen-inspect')) as any
  let vueData = layerData.__vue__
  let currentLayerData = vueData.layerData as LayerData
  let allLayerData = vueData.layerMap as Map<string, LayerData>

  if (!currentLayerData) {
    console.warn('当前没有选中图层')
    message.error('请先选中一个图层')
    return []
  }

  const currentLayerId = currentLayerData.id
  const currentRect = {
    x: currentLayerData.x,
    y: currentLayerData.y,
    width: currentLayerData.width,
    height: currentLayerData.height,
  }
  const containedLayers: LayerData[] = []

  // 遍历所有图层，找到当前图层本身以及被当前图层完全包含的图层
  allLayerData.forEach((layer: LayerData) => {
    const layerRect = {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    }

    // 当前图层本身，或者被当前图层完全包含
    if (layer.id === currentLayerId || isRectContained(currentRect, layerRect)) {
      containedLayers.push(layer)
    }
  })

  // 按图层索引排序，过滤可见且不透明度为1的图层
  const filteredLayers = containedLayers
    .sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0))
    .filter((v) => v.visible)
    .filter((v) => v.opacity == 1)

  console.log('当前图层及其包含的图层:', filteredLayers)
  console.log('当前图层rect:', currentRect)

  let formatedData = formatLayersForHtmlGeneration(filteredLayers)
  const output = `---
layerData结构描述:
- type: 图层类型
- name: 图层名称
- x, y: 坐标位置
- width, height: 尺寸
- css: 样式信息
- content: 图层内容

layerDatas:
${JSON.stringify(formatedData, null, 2)}
---
`
  copyToClipboard(output)
  message.success('已复制到剪贴板')
}
</script>

<template>
  <button class="ai-glow-btn" id="layer-data-btn" @click="getLayerDatas">获取layerDatas</button>
</template>

<style scoped>
.ai-glow-btn {
  position: relative;
  margin: 0 10px;
  padding: 6px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.ai-glow-btn::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: conic-gradient(from 0deg, #00f5ff, #7b2cbf, #ff006e, #00f5ff);
  border-radius: 10px;
  z-index: -1;
  animation: rotate-glow 2s linear infinite;
}

.ai-glow-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  z-index: -1;
}

@keyframes rotate-glow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
