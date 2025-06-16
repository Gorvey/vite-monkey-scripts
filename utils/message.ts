// 消息类型定义
export type MessageType = 'success' | 'error'

interface Message {
  id: number
  type: MessageType
  content: string
}

let messageId = 0
let messageList: Message[] = []

// 创建消息容器
function getMessageContainer() {
  let container = document.getElementById('global-message-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'global-message-container'
    Object.assign(container.style, {
      position: 'fixed',
      top: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      minWidth: '300px',
    })
    document.body.appendChild(container)
  }
  return container
}

function renderMessages() {
  const container = getMessageContainer()
  container.innerHTML = ''
  messageList.forEach((msg) => {
    const el = document.createElement('div')
    el.textContent = msg.content
    Object.assign(el.style, {
      margin: '8px 0',
      padding: '12px 24px',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '16px',
      background: msg.type === 'success' ? '#52c41a' : '#ff4d4f',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      pointerEvents: 'auto',
      minWidth: '200px',
      textAlign: 'center',
      opacity: '0.95',
      transition: 'all 0.3s',
    })
    container.appendChild(el)
  })
}

function addMessage(type: MessageType, content: string, duration = 3000) {
  const id = ++messageId
  messageList.push({ id, type, content })
  renderMessages()
  setTimeout(() => {
    messageList = messageList.filter((msg) => msg.id !== id)
    renderMessages()
  }, duration)
}

export const message = {
  success(content: string, duration?: number) {
    addMessage('success', content, duration)
  },
  error(content: string, duration?: number) {
    addMessage('error', content, duration)
  },
}
