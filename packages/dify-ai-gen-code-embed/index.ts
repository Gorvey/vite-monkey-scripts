import './styles/styles'

// 添加 markdown 样式
if (typeof GM_addStyle !== 'undefined') {
  GM_addStyle(`
    .markdown-body {
      line-height: 1.6;
      color: #24292e;
      background-color: transparent;
    }
    .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    .markdown-body h3 { font-size: 1.25em; }
    .markdown-body p { margin-bottom: 16px; }
    .markdown-body code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27,31,35,0.05);
      border-radius: 6px;
    }
    .markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-bottom: 16px;
      border: 1px solid #e1e4e8;
    }
    .markdown-body pre:hover {
      border-color: #c8e1ff;
    }
    .markdown-body pre code {
      background-color: transparent;
      border: 0;
      display: inline;
      line-height: inherit;
      margin: 0;
      max-width: auto;
      overflow: visible;
      padding: 0;
      word-wrap: normal;
    }
    .markdown-body blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin-bottom: 16px;
    }
    .markdown-body ul, .markdown-body ol {
      padding-left: 2em;
      margin-bottom: 16px;
    }
    .markdown-body li {
      margin-bottom: 0.25em;
    }
  `)
}

// 声明 marked 全局变量类型
declare const marked: {
  parse: (markdown: string) => string
}

abduct()

function abduct() {
  const xhrOPen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function () {
    const xhr = this

    if ((arguments as any)[1].includes('/api/interface/get?id=')) {
      const getterText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'responseText')?.get

      Object.defineProperty(xhr, 'responseText', {
        get: () => {
          let result = (getterText as any)?.call(xhr)
          setTimeout(() => {
            sessionStorage.setItem('result', result)
          }, 500)
          return result
        },
      })
    }

    return xhrOPen.apply(xhr, arguments as any)
  }
}
// Dify配置接口
interface DifyConfig {
  url: string
  apiKey: string
}

// 工作流参数接口
interface WorkflowParams {
  [key: string]: any
}

// 默认配置
const DEFAULT_CONFIG: DifyConfig = {
  url: 'https://api.dify.ai/v1',
  apiKey: '',
}

// 默认工作流参数（空对象，后续可以填写）
const DEFAULT_WORKFLOW_PARAMS: WorkflowParams = {}

/**
 * 使用油猴API管理配置
 */
class DifyConfigManager {
  private static CONFIG_KEY = 'dify_config'
  private static PARAMS_KEY = 'dify_workflow_params'

  static getConfig(): DifyConfig {
    if (typeof GM_getValue === 'undefined') {
      console.warn('油猴API不可用，使用默认配置')
      return DEFAULT_CONFIG
    }

    const config = GM_getValue(this.CONFIG_KEY, DEFAULT_CONFIG)
    return { ...DEFAULT_CONFIG, ...config }
  }

  static saveConfig(config: DifyConfig): void {
    if (typeof GM_setValue === 'undefined') {
      console.warn('油猴API不可用，无法保存配置')
      return
    }

    GM_setValue(this.CONFIG_KEY, config)
  }

  static getWorkflowParams(): WorkflowParams {
    if (typeof GM_getValue === 'undefined') {
      return DEFAULT_WORKFLOW_PARAMS
    }

    return GM_getValue(this.PARAMS_KEY, DEFAULT_WORKFLOW_PARAMS)
  }

  static saveWorkflowParams(params: WorkflowParams): void {
    if (typeof GM_setValue === 'undefined') {
      console.warn('油猴API不可用，无法保存工作流参数')
      return
    }

    GM_setValue(this.PARAMS_KEY, params)
  }
}

/**
 * Dify API客户端
 */
class DifyApiClient {
  private config: DifyConfig

  constructor(config: DifyConfig) {
    this.config = config
  }

  /**
   * 执行工作流（streaming模式）
   */
  async executeWorkflow(
    params: WorkflowParams,
    onMessage: (data: any) => void,
    onError: (error: string) => void,
    onComplete: () => void,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.config.url}/workflows/run`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: params,
          response_mode: 'streaming',
          user: 'user-monkey-script',
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onMessage(data)
            } catch (e) {
              console.warn('解析SSE数据失败:', line)
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
    }
  }
}

/**
 * 浮层UI管理器
 */
class OverlayManager {
  private overlay: HTMLElement | null = null
  private isVisible = false
  private streamingMessageDiv: HTMLElement | null = null
  private streamingContent = ''
  private renderTimeout: number | null = null

  /**
   * 创建浮层
   */
  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div')
    overlay.id = 'dify-ai-overlay'
    overlay.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `

    const container = overlay

    // 头部
    const header = document.createElement('div')
    header.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `

    const title = document.createElement('h3')
    title.textContent = 'AI 代码生成'
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    `

    const closeButton = document.createElement('button')
    closeButton.textContent = '✕'
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 5px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `
    closeButton.addEventListener('click', () => this.hide())
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = '#f3f4f6'
    })
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent'
    })

    header.appendChild(title)
    header.appendChild(closeButton)

    // 内容区域
    const content = document.createElement('div')
    content.id = 'dify-ai-content'
    content.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    `

    // 底部操作区
    const footer = document.createElement('div')
    footer.style.cssText = `
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `

    const configButton = document.createElement('button')
    configButton.textContent = '配置设置'
    configButton.style.cssText = `
      padding: 8px 16px;
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `
    configButton.addEventListener('click', () => this.showConfigModal())

    const executeButton = document.createElement('button')
    executeButton.textContent = '执行工作流'
    executeButton.style.cssText = `
      padding: 8px 16px;
      background-color: #155EEF;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    `
    executeButton.addEventListener('click', () => this.executeWorkflow())

    footer.appendChild(configButton)
    footer.appendChild(executeButton)

    overlay.appendChild(header)
    overlay.appendChild(content)
    overlay.appendChild(footer)

    return overlay
  }

  /**
   * 显示浮层
   */
  show(): void {
    if (!this.overlay) {
      this.overlay = this.createOverlay()
      document.body.appendChild(this.overlay)
    }

    this.isVisible = true
    this.overlay.style.display = 'flex'

    // 动画效果
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.style.opacity = '1'
        this.overlay.style.transform = 'translateY(0)'
      }
    })

    this.clearContent()
    this.addMessage('系统', '正在执行 AI 代码生成...')

    // 自动执行工作流
    setTimeout(() => {
      this.executeWorkflow()
    }, 500)
  }

  /**
   * 隐藏浮层
   */
  hide(): void {
    if (!this.overlay || !this.isVisible) return

    this.isVisible = false
    this.overlay.style.opacity = '0'
    this.overlay.style.transform = 'translateY(20px)'

    setTimeout(() => {
      if (this.overlay) {
        this.overlay.style.display = 'none'
      }
    }, 300)
  }

  /**
   * 清空内容
   */
  private clearContent(): void {
    const content = document.getElementById('dify-ai-content')
    if (content) {
      content.innerHTML = ''
    }
  }

  /**
   * 添加消息
   */
  addMessage(sender: string, message: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const content = document.getElementById('dify-ai-content')
    if (!content) return

    const messageDiv = document.createElement('div')
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#155EEF'};
      background-color: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#f8fafc'};
    `

    const senderSpan = document.createElement('strong')
    senderSpan.textContent = `${sender}: `
    senderSpan.style.cssText = `
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1e40af'};
    `

    const messageSpan = document.createElement('span')
    messageSpan.textContent = message
    messageSpan.style.color = '#374151'

    messageDiv.appendChild(senderSpan)
    messageDiv.appendChild(messageSpan)
    content.appendChild(messageDiv)

    // 滚动到底部
    content.scrollTop = content.scrollHeight
  }

  /**
   * 添加 Markdown 渲染的消息
   */
  addMarkdownMessage(sender: string, markdownContent: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const content = document.getElementById('dify-ai-content')
    if (!content) return

    const messageDiv = document.createElement('div')
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#155EEF'};
      background-color: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#f8fafc'};
    `

    const senderSpan = document.createElement('strong')
    senderSpan.textContent = `${sender}: `
    senderSpan.style.cssText = `
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1e40af'};
      display: block;
      margin-bottom: 8px;
    `

    const markdownDiv = document.createElement('div')
    markdownDiv.className = 'markdown-body'

    this.renderMarkdown(markdownDiv, markdownContent)

    messageDiv.appendChild(senderSpan)
    messageDiv.appendChild(markdownDiv)
    content.appendChild(messageDiv)

    // 滚动到底部
    content.scrollTop = content.scrollHeight
  }

  /**
   * 检测内容是否为代码
   */
  private isCodeContent(content: string): boolean {
    const codeIndicators = [
      'function',
      'const',
      'let',
      'var',
      'import',
      'export',
      'class',
      'interface',
      'type',
      'enum',
      '<template>',
      '<script>',
      '<style>',
      '<div>',
      '<span>',
      '#!/',
      '<?php',
      '<?xml',
      'def ',
      'class ',
      'import ',
      'from ',
      'public class',
      'private',
      'protected',
      '#include',
      '#define',
      'int main',
      '{',
      '}',
      '=>',
      '()',
      '[]',
    ]

    return codeIndicators.some((indicator) => content.includes(indicator))
  }

  /**
   * 检测代码语言类型
   */
  private detectLanguage(content: string): string {
    if (content.includes('<template>') || content.includes('<script>') || content.includes('<style>')) {
      return 'vue'
    }
    if (content.includes('import React') || content.includes('jsx') || content.includes('useState')) {
      return 'jsx'
    }
    if (content.includes('<html>') || content.includes('<!DOCTYPE') || content.includes('<head>')) {
      return 'html'
    }
    if (
      content.includes('interface ') ||
      content.includes(': string') ||
      content.includes('type ') ||
      content.includes('enum ')
    ) {
      return 'typescript'
    }
    if (
      content.includes('def ') ||
      content.includes('import ') ||
      content.includes('from ') ||
      content.includes('print(')
    ) {
      return 'python'
    }
    if (content.includes('<?php') || content.includes('$')) {
      return 'php'
    }
    if (content.includes('public class') || content.includes('private ') || content.includes('System.out')) {
      return 'java'
    }
    if (content.includes('#include') || content.includes('int main') || content.includes('printf')) {
      return 'c'
    }
    if (content.includes('SELECT') || content.includes('FROM') || content.includes('WHERE')) {
      return 'sql'
    }
    if (content.includes('{') || content.includes('function') || content.includes('const') || content.includes('=>')) {
      return 'javascript'
    }

    return 'text'
  }

  /**
   * 渲染 Markdown 内容
   */
  private renderMarkdown(container: HTMLElement, content: string): void {
    try {
      // 检查 marked 是否可用
      if (typeof marked !== 'undefined' && marked.parse) {
        // 检测内容类型并适当处理
        let processedContent = content.trim()

        // 如果内容不是明显的 markdown 格式，但包含代码，尝试包装为代码块
        if (
          !processedContent.includes('```') &&
          !processedContent.includes('#') &&
          !processedContent.includes('**') &&
          this.isCodeContent(processedContent)
        ) {
          const language = this.detectLanguage(processedContent)
          processedContent = '```' + language + '\n' + processedContent + '\n```'
        }

        container.innerHTML = marked.parse(processedContent)
      } else {
        // marked 不可用，使用简单的代码块格式
        console.warn('marked 库不可用，使用简单格式')
        const pre = document.createElement('pre')
        const code = document.createElement('code')
        code.textContent = content
        code.style.cssText = `
          background-color: #f6f8fa;
          padding: 16px;
          border-radius: 6px;
          display: block;
          overflow-x: auto;
          white-space: pre-wrap;
        `
        pre.appendChild(code)
        container.appendChild(pre)
      }
    } catch (error) {
      console.error('Markdown 渲染失败:', error)
      // 渲染失败时使用纯文本
      const pre = document.createElement('pre')
      pre.textContent = content
      pre.style.cssText = `
        background-color: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        white-space: pre-wrap;
        margin: 0;
      `
      container.appendChild(pre)
    }
  }

  /**
   * 开始流式消息
   */
  startStreamingMessage(sender: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const content = document.getElementById('dify-ai-content')
    if (!content) return

    // 清空之前的流式内容
    this.streamingContent = ''

    const messageDiv = document.createElement('div')
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#155EEF'};
      background-color: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#f8fafc'};
    `

    const senderSpan = document.createElement('strong')
    senderSpan.textContent = `${sender}: `
    senderSpan.style.cssText = `
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#1e40af'};
      display: block;
      margin-bottom: 8px;
    `

    const markdownDiv = document.createElement('div')
    markdownDiv.className = 'markdown-body'
    markdownDiv.style.minHeight = '20px'

    messageDiv.appendChild(senderSpan)
    messageDiv.appendChild(markdownDiv)
    content.appendChild(messageDiv)

    // 保存引用以便更新
    this.streamingMessageDiv = markdownDiv

    // 滚动到底部
    content.scrollTop = content.scrollHeight
  }

  /**
   * 更新流式消息内容
   */
  updateStreamingMessage(newContent: string): void {
    if (!this.streamingMessageDiv) return

    this.streamingContent += newContent
    this.renderMarkdown(this.streamingMessageDiv, this.streamingContent)

    // 滚动到底部
    const content = document.getElementById('dify-ai-content')
    if (content) {
      content.scrollTop = content.scrollHeight
    }
  }

  /**
   * 结束流式消息
   */
  endStreamingMessage(): void {
    this.streamingMessageDiv = null
    this.streamingContent = ''
  }

  /**
   * 显示配置弹窗
   */
  private showConfigModal(): void {
    const config = DifyConfigManager.getConfig()

    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 10001;
      display: flex;
      justify-content: center;
      align-items: center;
    `

    const form = document.createElement('div')
    form.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 400px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `

    form.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #1f2937;">Dify 配置</h3>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">API URL:</label>
        <input type="text" id="dify-url" value="${config.url}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: 500;">API Key:</label>
        <input type="password" id="dify-api-key" value="${config.apiKey}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button id="cancel-config" style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">取消</button>
        <button id="save-config" style="padding: 8px 16px; background: #155EEF; color: white; border: none; border-radius: 6px; cursor: pointer;">保存</button>
      </div>
    `

    modal.appendChild(form)
    document.body.appendChild(modal)

    // 事件处理
    const cancelBtn = modal.querySelector('#cancel-config') as HTMLButtonElement
    const saveBtn = modal.querySelector('#save-config') as HTMLButtonElement
    const urlInput = modal.querySelector('#dify-url') as HTMLInputElement
    const apiKeyInput = modal.querySelector('#dify-api-key') as HTMLInputElement

    cancelBtn.addEventListener('click', () => modal.remove())

    saveBtn.addEventListener('click', () => {
      const newConfig: DifyConfig = {
        url: urlInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
      }

      DifyConfigManager.saveConfig(newConfig)
      this.addMessage('系统', '配置已保存', 'success')
      modal.remove()
    })

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  /**
   * 执行工作流
   */
  private async executeWorkflow(): Promise<void> {
    try {
      const config = DifyConfigManager.getConfig()

      if (!config.apiKey) {
        this.addMessage('错误', '请先配置API Key，点击"配置设置"按钮进行配置', 'error')
        return
      }

      if (!config.url) {
        this.addMessage('错误', 'API URL不能为空，请检查配置', 'error')
        return
      }

      // 直接从 sessionStorage 获取数据构建参数，不存储到 GM storage
      const yapiReqbody = sessionStorage.getItem('result') || ''
      if (!yapiReqbody) {
        this.addMessage('错误', '未获取到接口数据，请先访问接口页面获取数据', 'error')
        return
      }

      const params = {
        yapi_reqbody: yapiReqbody,
        template: 'vue3+ts',
      }

      const client = new DifyApiClient(config)

      let isStreamingStarted = false

      await client.executeWorkflow(
        params,
        (data) => {
          // 处理不同类型的流式事件
          if (data.event === 'workflow_started') {
            // 开始流式渲染
            this.startStreamingMessage('AI 生成结果', 'success')
            isStreamingStarted = true
          } else if (data.event === 'text_chunk' || data.event === 'agent_message') {
            // 处理文本块流式输出
            if (isStreamingStarted && data.data?.text) {
              this.updateStreamingMessage(data.data.text)
            }
          } else if (data.event === 'node_finished') {
            // 节点完成时可能包含输出内容
            if (isStreamingStarted && data.data?.outputs) {
              let content = ''
              if (typeof data.data.outputs === 'object') {
                for (const [key, value] of Object.entries(data.data.outputs)) {
                  if (typeof value === 'string' && value.trim()) {
                    content = value
                    break
                  }
                }
              } else if (typeof data.data.outputs === 'string') {
                content = data.data.outputs
              }

              if (content) {
                this.updateStreamingMessage(content)
              }
            }
          } else if (data.event === 'workflow_finished') {
            this.addMessage('工作流', '工作流执行完成', 'success')

            // 如果还没有开始流式渲染，或者需要显示最终结果
            if (!isStreamingStarted) {
              // 渲染最终结果（非流式模式的后备方案）
              if (data.data?.outputs) {
                let resultContent = ''

                if (typeof data.data.outputs === 'object') {
                  for (const [key, value] of Object.entries(data.data.outputs)) {
                    if (typeof value === 'string' && value.trim()) {
                      resultContent = value
                      break
                    }
                  }

                  if (!resultContent) {
                    resultContent = '```json\n' + JSON.stringify(data.data.outputs, null, 2) + '\n```'
                  }
                } else if (typeof data.data.outputs === 'string') {
                  resultContent = data.data.outputs
                }

                this.addMarkdownMessage('AI 生成结果', resultContent, 'success')
              }
            } else {
              // 结束流式渲染
              this.endStreamingMessage()
            }
          } else if (data.event === 'error') {
            this.addMessage('错误', data.data?.message || '未知错误', 'error')
            if (isStreamingStarted) {
              this.endStreamingMessage()
            }
          }
        },
        (error) => {
          this.addMessage('错误', `执行失败: ${error}`, 'error')
          if (isStreamingStarted) {
            this.endStreamingMessage()
          }
        },
        () => {
          // 确保流式渲染结束
          if (isStreamingStarted) {
            this.endStreamingMessage()
          }
        },
      )
    } catch (error) {
      this.addMessage('错误', `执行异常: ${error instanceof Error ? error.message : String(error)}`, 'error')
    }
  }
}

// 全局实例
const overlayManager = new OverlayManager()

/**
 * 创建固定按钮
 */
function createFixedButton(): void {
  // 检查按钮是否已存在
  if (document.getElementById('dify-ai-gen-code-button')) {
    return
  }

  // 创建按钮
  const button = document.createElement('button')
  button.id = 'dify-ai-gen-code-button'
  button.textContent = 'AI 代码生成'

  // 设置按钮样式
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 20px;
    background-color: #155EEF;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(21, 94, 239, 0.3);
    transition: all 0.3s ease;
  `

  // 添加悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)'
    button.style.boxShadow = '0 6px 16px rgba(21, 94, 239, 0.4)'
  })

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)'
    button.style.boxShadow = '0 4px 12px rgba(21, 94, 239, 0.3)'
  })

  // 点击事件 - 显示浮层
  button.addEventListener('click', () => {
    overlayManager.show()
  })

  // 添加到页面
  document.body.appendChild(button)
}

// 页面加载完成后创建按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFixedButton)
} else {
  createFixedButton()
}
