import { copyToClipboard } from '../../utils/copyToClipboard'
import { message } from '../../utils/message'
import '../../packages/copy-multi-zentao-bug-id/styles/styles'

const CONFIG = {
  wrapper: '#mainContent',
  ulList: 'ul.timeline',
  searchBtn: '#bysearchTab',
}

function addGlobalCopyTitleCheckbox() {
  const searchBtn = document.querySelector(CONFIG.searchBtn)
  if (searchBtn && !document.getElementById('zentao-copy-title-global')) {
    const label = document.createElement('label')
    label.className = 'zentao-bugid-toolbar-label'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = 'zentao-copy-title-global'
    checkbox.className = 'zentao-bugid-checkbox'
    // 读取localStorage
    checkbox.value = localStorage.getItem('zentao-copy-title-global') || ''
    checkbox.checked = localStorage.getItem('zentao-copy-title-global') === 'true'
    checkbox.addEventListener('change', () => {
      localStorage.setItem('zentao-copy-title-global', checkbox.checked ? 'true' : 'false')
    })
    label.appendChild(checkbox)
    label.appendChild(document.createTextNode('是否复制标题'))

    // 新增prefix输入框
    const prefixLabel = document.createElement('label')
    prefixLabel.className = 'zentao-bugid-toolbar-label'
    prefixLabel.style.marginLeft = '8px'
    const prefixInput = document.createElement('input')
    prefixInput.type = 'text'
    prefixInput.id = 'zentao-copy-prefix-global'
    prefixInput.placeholder = '前缀'
    prefixInput.style.width = '60px'
    prefixInput.style.marginLeft = '4px'
    // 从localStorage读取
    prefixInput.value = localStorage.getItem('zentao-copy-prefix-global') || ''
    prefixInput.addEventListener('input', () => {
      localStorage.setItem('zentao-copy-prefix-global', prefixInput.value)
    })
    prefixLabel.appendChild(document.createTextNode('前缀'))
    prefixLabel.appendChild(prefixInput)
    label.appendChild(prefixLabel)

    searchBtn.parentElement?.insertBefore(label, searchBtn.nextSibling)
  }
}

function injectCustomButton() {
  // 查找panel-title为最新动态的div
  const panelTitle = Array.from(document.querySelectorAll('.panel-title')).find(
    (el) => el.textContent?.trim() === '最新动态',
  )
  if (panelTitle && !document.getElementById('zentao-custom-url-btn')) {
    // 创建按钮
    const btn = document.createElement('button')
    btn.id = 'zentao-custom-url-btn'
    btn.textContent = '前往复制bug'
    btn.style.marginLeft = '12px'
    btn.style.fontSize = '12px'
    btn.style.padding = '2px 8px'
    // 读取URL
    let url = localStorage.getItem('zentao-custom-url') || ''
    btn.addEventListener('click', () => {
      if (!url) {
        url = prompt('请输入跳转URL', '') || ''
        if (url) localStorage.setItem('zentao-custom-url', url)
      }
      if (url) window.open(url, '_blank')
    })
    // 右侧插入
    panelTitle.appendChild(btn)
  }
}

function insertToolbar(ul: HTMLUListElement, ulIdx: number) {
  if (ul.previousElementSibling && ul.previousElementSibling.classList.contains('zentao-bugid-toolbar')) return null
  const toolbar = document.createElement('div')
  toolbar.className = 'zentao-bugid-toolbar'
  const idSuffix = 'ul-' + ulIdx
  toolbar.innerHTML = `
    <button id="zentao-copy-btn-${idSuffix}" class="zentao-bugid-btn">复制</button>
    <button id="zentao-select-all-btn-${idSuffix}" class="zentao-bugid-btn">全选</button>
    <button id="zentao-invert-btn-${idSuffix}" class="zentao-bugid-btn">反选</button>
  `
  ul.parentNode?.insertBefore(toolbar, ul)
  return { toolbar, idSuffix }
}

function insertBugCheckboxes(ul: HTMLUListElement) {
  const labels = ul.querySelectorAll('.label.label-id')
  labels.forEach((label: Element) => {
    if (!label.nextElementSibling?.classList.contains('zentao-bugid-checkbox')) {
      const value = label.textContent?.trim() || ''
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'zentao-bugid-checkbox'
      checkbox.value = value
      checkbox.checked = true // 默认勾选
      label.insertAdjacentElement('afterend', checkbox)
    }
  })
}

function bindToolbarEvents(toolbar: HTMLElement, ul: HTMLUListElement, idSuffix: string) {
  const getCheckedBugIds = () => {
    const checkboxes = ul.querySelectorAll('.zentao-bugid-checkbox') as NodeListOf<HTMLInputElement>
    return Array.from(checkboxes)
      .filter((cb: HTMLInputElement) => cb.checked)
      .map((cb: HTMLInputElement) => cb.value)
  }
  const setAllCheckboxes = (checked: boolean) => {
    const checkboxes = ul.querySelectorAll('.zentao-bugid-checkbox') as NodeListOf<HTMLInputElement>
    checkboxes.forEach((cb: HTMLInputElement) => (cb.checked = checked))
  }
  const invertCheckboxes = () => {
    const checkboxes = ul.querySelectorAll('.zentao-bugid-checkbox') as NodeListOf<HTMLInputElement>
    checkboxes.forEach((cb: HTMLInputElement) => (cb.checked = !cb.checked))
  }
  toolbar.querySelector(`#zentao-copy-btn-${idSuffix}`)?.addEventListener('click', () => {
    const ids = getCheckedBugIds()
    const copyTitle = (document.getElementById('zentao-copy-title-global') as HTMLInputElement)?.checked
    // 读取prefix
    const prefix = (document.getElementById('zentao-copy-prefix-global') as HTMLInputElement)?.value || ''
    if (ids.length) {
      let text = ids.join('\n')
      if (copyTitle) {
        // 获取所有选中bug的标题（修正：根据id精确查找label和a）
        const bugTitles: string[] = []
        ids.forEach((id) => {
          // 查找label.label-id内容为id的元素
          const label = Array.from(ul.querySelectorAll('.label.label-id')).find((l) => l.textContent?.trim() === id)
          if (label) {
            // 查找同一行的a标签（bug标题）
            const a = label.parentElement?.querySelector('a')
            if (a) {
              if (a?.textContent?.length ?? 0 > 28) {
                bugTitles.push(a.textContent?.trim().slice(0, 28) + '...' || '')
              } else {
                bugTitles.push(a.textContent?.trim() || '')
              }
            } else {
              bugTitles.push('')
            }
          } else {
            bugTitles.push('')
          }
        })
        // 标题和ID一一对应，格式：prefix ID 标题
        text = ids.map((id, idx) => `${prefix ? prefix + ' ' : ''}${id} ${bugTitles[idx] || ''}`).join('\n\n')
      } else {
        // 只复制ID，带前缀
        text = ids.map((id) => `${prefix ? prefix + ' ' : ''}${id}`).join('\n\n')
      }
      copyToClipboard(text)
      message.success('复制成功')
    } else {
      message.error('请先勾选要复制的Bug ID')
    }
  })
  toolbar.querySelector(`#zentao-select-all-btn-${idSuffix}`)?.addEventListener('click', () => {
    setAllCheckboxes(true)
  })
  toolbar.querySelector(`#zentao-invert-btn-${idSuffix}`)?.addEventListener('click', () => {
    invertCheckboxes()
  })
}

function main() {
  addGlobalCopyTitleCheckbox()
  injectCustomButton()
  const wrapper = document.querySelector(CONFIG.wrapper) as HTMLDivElement
  const ulLists = wrapper.querySelectorAll(CONFIG.ulList) as NodeListOf<HTMLUListElement>
  ulLists.forEach((ul: HTMLUListElement, ulIdx: number) => {
    const toolbarInfo = insertToolbar(ul, ulIdx)
    insertBugCheckboxes(ul)
    if (toolbarInfo) {
      bindToolbarEvents(toolbarInfo.toolbar, ul, toolbarInfo.idSuffix)
    }
  })
}

main()
