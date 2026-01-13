<script setup lang="ts">
import { waitElement } from '../../../utils/waitElement'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import type { LayerData } from '../types'

/**
 * 检查两个矩形是否重叠
 */
const isRectOverlap = (rect1: LayerData['rect'], rect2: LayerData['rect']): boolean => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  )
}

/**
 * 检查一个矩形是否完全包含另一个矩形
 */
const isRectContained = (outer: LayerData['rect'], inner: LayerData['rect']): boolean => {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  )
}

/**
 * 格式化图层数据用于HTML生成
 */
const formatLayersForHtmlGeneration = (layers: LayerData[]) => {
  return layers
    .map((layer) => ({
      type: layer.type,
      name: layer.name,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      css: layer.css,
      fills: layer.fills?.map((fill) => ({
        fillType: fill.fillType,
        color: fill.color
          ? {
              'color-hex': fill.color['color-hex'],
              'css-rgba': fill.color['css-rgba'],
            }
          : undefined,
      })),
      borders: layer.borders,
      shadows: layer.shadows,
      radius: layer.radius,
      layerIndex: layer.layerIndex,
    }))
    .filter((v) => v.type === 'shape')
}

/**
 * 获取同一区域的所有图层数据
 */
const getLayerDatas = async () => {
  console.log('getLayerDatas')
  const layerData = (await waitElement('.screen-inspect')) as any
  let vueData = layerData.__vue__
  let currentLayerData = vueData.layerData as LayerData
  let allLayerData = vueData.layerMap as Map<string, LayerData>

  if (!currentLayerData?.rect) {
    console.warn('当前图层没有 rect 信息')
    return []
  }

  const currentRect = currentLayerData.rect
  const sameAreaLayers: LayerData[] = []

  // 遍历所有图层，找到同一区域的图层
  allLayerData.forEach((layer: LayerData) => {
    if (!layer.rect) return

    // 检查是否重叠或包含关系
    if (
      isRectOverlap(currentRect, layer.rect) ||
      isRectContained(currentRect, layer.rect) ||
      isRectContained(layer.rect, currentRect)
    ) {
      sameAreaLayers.push(layer)
    }
  })

  // 按图层索引排序
  sameAreaLayers
    .sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0))
    .filter((v) => v.visible)
    .filter((v) => v.opacity == 1)

  console.log('同一区域的图层:', sameAreaLayers)
  console.log('当前图层rect:', currentRect)

  let formatedData = formatLayersForHtmlGeneration(sameAreaLayers)
  copyToClipboard(JSON.stringify(formatedData, null, 2))
}
</script>

<template>
  <div style="margin: 0px 10px; cursor: pointer" id="layer-data-btn" @click="getLayerDatas">获取layerDatas</div>
</template>
