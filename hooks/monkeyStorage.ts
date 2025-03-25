import { ref, Ref, reactive, watch } from 'vue'

interface MonkeyStorageOptions<T> {
  key: string
  defaultValue?: T
  /**
   * 是否在组件挂载时自动加载数据
   * @default true
   */
  autoLoad?: boolean
}

// 添加一个简单的事件总线
const eventBus = reactive(new Map<string, number>())

/**
 * 使用油猴API存储和获取数据的Hook
 * @param options 配置选项
 * @returns 包含数据和操作方法的对象
 */
export function useMonkeyStorage<T>(options: MonkeyStorageOptions<T>) {
  const { key, defaultValue, autoLoad = true } = options
  const data = ref(defaultValue) as Ref<T>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 从油猴存储中加载数据
   */
  const load = () => {
    try {
      isLoading.value = true
      error.value = null

      // 检查油猴API是否可用
      if (typeof GM_getValue === 'undefined') {
        throw new Error('油猴API不可用，请确保脚本在油猴环境中运行')
      }

      const storedValue = GM_getValue(key)
      data.value = storedValue === undefined ? defaultValue : storedValue
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('从油猴存储加载数据失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 如果设置了自动加载，则在创建hook时加载数据
  if (autoLoad) {
    load()
  }

  // 添加对事件总线的监听
  watch(
    () => eventBus.get(key),
    () => {
      // 当事件总线上的值变化时，重新从存储中获取数据
      const storedValue = GM_getValue(key)
      if (storedValue !== undefined) {
        data.value = storedValue as T
      }
    },
  )

  /**
   * 将数据保存到油猴存储
   * @param value 要保存的值，如果未提供则使用当前data值
   */
  const save = (value?: T) => {
    try {
      error.value = null

      // 检查油猴API是否可用
      if (typeof GM_setValue === 'undefined') {
        throw new Error('油猴API不可用，请确保脚本在油猴环境中运行')
      }

      const valueToSave = value !== undefined ? value : data.value
      GM_setValue(key, valueToSave)
      // 如果提供了新值，更新当前数据
      if (value !== undefined) {
        data.value = value
      }

      // 更新事件总线，通知其他组件
      eventBus.set(key, Date.now())
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('保存数据到油猴存储失败:', err)
    }
  }

  /**
   * 从油猴存储中删除数据
   */
  const remove = () => {
    try {
      error.value = null

      // 检查油猴API是否可用
      if (typeof GM_deleteValue === 'undefined') {
        throw new Error('油猴API不可用，请确保脚本在油猴环境中运行')
      }

      GM_deleteValue(key)
      data.value = defaultValue as T
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('从油猴存储删除数据失败:', err)
    }
  }

  return {
    data,
    isLoading,
    error,
    load,
    save,
    remove,
  }
}
