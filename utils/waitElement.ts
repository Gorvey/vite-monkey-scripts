export function waitElement(selector: string, target = document.body) {
  return new Promise((resolve) => {
    {
      const element = target.querySelector(selector)
      if (element) {
        return resolve(element)
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue

          if (node.matches(selector)) {
            observer.disconnect()
            resolve(node)
            return
          }
          const childElement = node.querySelector(selector)
          if (childElement) {
            observer.disconnect()
            resolve(childElement)
            return
          }
        }
      }
    })

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    })
  })
}

export function waitElementAttribute(
  attribute: string,
  target: HTMLElement,
  timeout = 5000, // 默认超时时间 5 秒
): Promise<any> {
  return new Promise((resolve, reject) => {
    // 检查元素是否已有该属性
    if (target[attribute as keyof HTMLElement]) {
      return resolve(target[attribute as keyof HTMLElement])
    }

    const startTime = Date.now()
    const checkInterval = 100 // 每100ms检查一次
    let timer: NodeJS.Timeout

    const check = () => {
      // 检查是否超时
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`等待属性 ${attribute} 超时`))
        return
      }

      // 检查属性是否存在
      if (target[attribute as keyof HTMLElement]) {
        clearTimeout(timer)
        resolve(target[attribute as keyof HTMLElement])
        return
      }

      // 继续检查
      timer = setTimeout(check, checkInterval)
    }

    // 开始检查
    check()
  })
}
