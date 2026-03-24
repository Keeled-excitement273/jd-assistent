import { getStoredAccessToken } from '../stores/user'

export class SSEClient {
  constructor(taskId, onEvent, onError) {
    this.taskId = taskId
    this.onEvent = onEvent
    this.onError = onError
    this.eventSource = null
  }

  connect() {
    if (this.eventSource) {
      this.disconnect()
    }

    const token = getStoredAccessToken()
    const query = token ? `?access_token=${encodeURIComponent(token)}` : ''
    const url = `/api/v1/tasks/${this.taskId}/stream${query}`
    this.eventSource = new EventSource(url)

    // 默认 message 事件
    this.eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        this.onEvent('message', data)
      } catch (err) {
        console.error('Failed to parse SSE data', err)
      }
    }

    // 监听各类自定义事件
    const eventTypes = [
      'node_start', 
      'node_complete', 
      'review_feedback', 
      'complete', 
      'error', 
      'heartbeat'
    ]

    eventTypes.forEach(type => {
      this.eventSource.addEventListener(type, (e) => {
        try {
          const data = JSON.parse(e.data)
          this.onEvent(type, data)
        } catch (err) {
          console.error(`Failed to parse SSE data for event ${type}`, err)
        }
      })
    })

    this.eventSource.onerror = (err) => {
      console.error('SSE Connection Error:', err)
      if (this.onError) this.onError(err)
      // SSE 默认会自动重连，如果需要手动控制可以在此处 disconnect
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}
