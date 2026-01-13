import { LayerData } from './types'
import { createApp, App } from 'vue'
import Settings from './components/settings.vue'
import Code from './components/code.vue'
import LayerDataComponent from './components/layerData.vue'
import './styles/styles'
// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css'
const CONFIG = {
  screenInspect: '.screen-inspect',
  screenHeader: '.screen-header__section--right .screen-header__item',
  cssCodeNavs: '.css-node__codes--navs',
  cssCopyBtn: '.css-node__copy',
  screenListWrapper: 'div[page-list][screen-list]', // 页面左侧页面list
  screenInspectorPanel: 'aside.screen-inspector', // 页面右侧标注信息panel
}

let screenInspectorPanelVueInstance: any = null
let listWrapperVueInstance: any = null
let layerData = ref<LayerData | null>(null)
let screenListWrapper = (await waitElement(CONFIG.screenListWrapper)) as any
listWrapperVueInstance = await waitElementAttribute('__vue__', screenListWrapper)

let codeAppInstance: App | null = null
let codeAppContainer: HTMLElement | null = null

// 当screen属性发生变化时，获取当前screen的layerData
const handleScreenChange = async () => {
  screenInspectorPanelVueInstance = null
  let panel = (await waitElement(CONFIG.screenInspectorPanel)) as any
  screenInspectorPanelVueInstance = panel.__vue__
  screenInspectorPanelVueInstance.$watch(
    'layerData',
    (value: LayerData) => {
      console.log('layerData change', value)
      layerData.value = toRaw(value)
      // 销毁旧的 codeApp
      if (codeAppInstance && codeAppContainer) {
        codeAppInstance.unmount()
        codeAppContainer.remove()
        codeAppInstance = null
        codeAppContainer = null
      }
      // 重新挂载 codeApp
      const codeNavs = document.querySelector(CONFIG.cssCodeNavs) as any
      if (codeNavs) {
        codeAppInstance = createApp(Code, {
          layerData: layerData,
        }) as App
        codeAppContainer = document.createElement('div')
        codeNavs.parentNode.insertBefore(codeAppContainer, codeNavs)
        codeAppInstance.mount(codeAppContainer)
      }
    },
    { deep: true, immediate: true },
  )

  const screenHeader = (await waitElement(CONFIG.screenHeader)) as any
  if (!document.getElementById('tailwind-setting-btn')) {
    createApp(Settings).mount(
      (() => {
        const app = document.createElement('div')
        app.setAttribute('id', 'tailwind-setting-btn')
        screenHeader.parentNode.insertBefore(app, screenHeader)
        return app
      })(),
    )
  }
  if (!document.getElementById('layer-data-btn')) {
    createApp(LayerDataComponent).mount(
      (() => {
        const app = document.createElement('div')
        app.setAttribute('id', 'layer-data-btn')
        screenHeader.parentNode.insertBefore(app, screenHeader)
        return app
      })(),
    )
  }
}
listWrapperVueInstance.$watch(
  'screen',
  (value: any) => {
    if (value) {
      console.log('screenChange', value)
      handleScreenChange()
    }
  },
  { immediate: true, deep: true },
)

window.addEventListener('codesign-css-to-tailwind-refresh', async () => {
  // 销毁 codeApp
  if (codeAppInstance && codeAppContainer) {
    codeAppInstance.unmount()
    codeAppContainer.remove()
    codeAppInstance = null
    codeAppContainer = null
  }
  // 销毁 Settings
  const settingBtn = document.getElementById('tailwind-setting-btn')
  if (settingBtn) {
    settingBtn.remove()
  }
  // 销毁所有 .css-node__codes--navs 前的 codeApp 容器
  const codeNavs = document.querySelector(CONFIG.cssCodeNavs)
  if (
    codeNavs &&
    codeNavs.previousSibling &&
    (codeNavs.previousSibling as HTMLElement).classList?.contains('css-node')
  ) {
    ;(codeNavs.previousSibling as HTMLElement).remove()
  }
  // 重新获取 listWrapperVueInstance 并设置 watch
  screenListWrapper = (await waitElement(CONFIG.screenListWrapper)) as any
  listWrapperVueInstance = await waitElementAttribute('__vue__', screenListWrapper)
  listWrapperVueInstance.$watch(
    'screen',
    (value: any) => {
      if (value) {
        console.log('screenChange', value)
        handleScreenChange()
      }
    },
    { immediate: true, deep: true },
  )
  // 重新执行初始化逻辑
  handleScreenChange()
})
