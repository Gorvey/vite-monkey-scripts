import { LayerData } from './types'
import { createApp, App } from 'vue'
import Settings from './components/settings.vue'
import Code from './components/code.vue'
import './styles/styles'
// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css'
const CONFIG = {
  cssCodeNavs: '.css-node__codes--navs + div',
  cssCopyBtn: '.css-node__copy',
  screenListWrapper: 'div[page-list][screen-list]', // 页面左侧页面list
  screenInspectorPanel: 'aside.screen-inspector', // 页面右侧标注信息panel
}

let screenInspectorPanelVueInstance: any = null
let listWrapperVueInstance: any = null
let layerData = ref<LayerData | null>(null)
let screenListWrapper = (await waitElement(CONFIG.screenListWrapper)) as any
listWrapperVueInstance = await waitElementAttribute('__vue__', screenListWrapper)

// 当screen属性发生变化时，获取当前screen的layerData
const handleScreenChange = async () => {
  screenInspectorPanelVueInstance = null
  let panel = (await waitElement(CONFIG.screenInspectorPanel)) as any
  screenInspectorPanelVueInstance = panel.__vue__
  screenInspectorPanelVueInstance.$watch(
    'layerData',
    (value: LayerData) => {
      layerData.value = toRaw(value)
    },
    { deep: true, immediate: true },
  )

  const codeNavs = (await waitElement(CONFIG.cssCodeNavs)) as any
  const codeApp = createApp(Code, {
    layerData: layerData,
  }) as App
  if (!document.getElementById('tailwind-setting-btn')) {
    createApp(Settings).mount(
      (() => {
        const app = document.createElement('div')
        app.setAttribute('id', 'tailwind-setting-btn')
        codeNavs.parentNode.insertBefore(app, codeNavs)
        return app
      })(),
    )

    codeApp.mount(
      (() => {
        const app = document.createElement('div')
        codeNavs.parentNode.insertBefore(app, codeNavs)
        return app
      })(),
    )
  }
}
listWrapperVueInstance.$watch(
  'screen',
  (value: any) => {
    if (value) {
      handleScreenChange()
    }
  },
  { immediate: true, deep: true },
)
