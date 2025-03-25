export interface Color {
  r: number
  g: number
  b: number
  a: number
  'color-hex': string
  'argb-hex': string
  'css-rgba': string
  'ui-color': string
}

export interface LayerData {
  markedForExport: boolean
  xdNode?: {
    _childrenList: any[]
  }
  id: string
  master_id: string
  object_id: string
  type: string
  name: string
  visible: boolean
  parent_id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  css: string[]
  borders: any[]
  fills: Array<{
    fillType: string
    color: Color
  }>
  shadows: any[]
  radius: number[]
  layerIndex: number
  parent?: LayerData
  symbolId?: string
  layers?: LayerData[]
  isSliceChild?: boolean
}
