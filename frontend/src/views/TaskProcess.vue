<template>
  <div class="task-process-page container mx-auto px-4 max-w-6xl">
    <section class="surface-panel task-process-hero px-6 py-7 print:hidden md:px-8">
      <div class="task-process-hero__row">
        <div class="task-process-hero__intro">
          <p class="eyebrow">任务执行</p>
          <h1 class="task-process-title page-heading mt-3 text-3xl sm:text-4xl">优化流执行状态</h1>
          <p class="page-copy mt-4 text-sm sm:text-base">
            这里会持续同步每个 AI 节点的处理状态，并在完成后展示最终预览与导出操作。
          </p>
        </div>

        <div class="task-process-hero__meta">
          <span class="status-chip" :class="statusChipClass">
            {{ statusLabel }}
          </span>

          <div v-if="status === 'completed'" class="task-process-actions">
            <button @click="exportWord" class="btn btn-secondary" :disabled="exportingWord">
              <svg class="task-process-accent-icon h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              {{ exportingWord ? '正在导出...' : '导出 Word' }}
            </button>
            <button @click="exportPdf" class="btn btn-primary">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              导出 PDF
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="globalError" class="card task-process-error p-6 mt-6 print:hidden">
      <div class="task-process-error__heading flex items-center gap-2 mb-2">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 class="font-semibold text-base">任务执行异常</h2>
      </div>
      <p class="task-process-error__copy">{{ globalError }}</p>
      <div class="mt-4">
        <router-link to="/" class="btn btn-secondary text-sm">返回首页</router-link>
      </div>
    </div>

    <div class="grid lg:grid-cols-12 gap-8 mt-6 print:block">
      <div class="lg:col-span-4 transition-all duration-500 print:hidden" :class="{ 'lg:col-span-12': !showPreview }">
        <ProgressTracker :logs="nodeLogs" :feedbacks="reviewFeedbacks" :status="status" />
      </div>

      <div v-if="showPreview" class="lg:col-span-8 animate-fade-in print:block">
        <ResumePreview :data="previewResult" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { SSEClient } from '../api/sse'
import api from '../api'
import { useUserStore } from '../stores/user'

import ProgressTracker from '../components/ProgressTracker.vue'
import ResumePreview from '../components/ResumePreview.vue'

const route = useRoute()
const taskId = route.params.id
const userStore = useUserStore()

const status = ref('processing')
const globalError = ref('')
const finalResult = ref(null)
const exportingWord = ref(false)

const nodeLogs = ref([
  { node: 'profile_builder', status: 'pending', label: '① 提取画像事实', message: '等待中...' },
  { node: 'jd_analyst', status: 'pending', label: '② 拆解岗位痛点', message: '等待中...' },
  { node: 'content_optimizer', status: 'pending', label: '③ STAR 经历重写', message: '等待中...' },
  { node: 'content_reviewer', status: 'pending', label: '④ AI 幻觉交叉审查', message: '等待中...' },
  { node: 'final_typesetter', status: 'pending', label: '⑤ JSON 终审排版', message: '等待中...' }
])

const reviewFeedbacks = ref([])
let sseClient = null
let statusPollingTimer = null
let isSyncingSnapshot = false

const showPreview = computed(() => {
  return status.value === 'completed' && finalResult.value !== null
})

const previewResult = computed(() => finalResult.value || {})

const statusLabelMap = {
  processing: '执行中',
  completed: '已完成',
  failed: '执行失败'
}

const statusClassMap = {
  processing: 'status-chip-processing',
  completed: 'status-chip-completed',
  failed: 'status-chip-failed'
}

const statusLabel = computed(() => statusLabelMap[status.value] || '状态未知')
const statusChipClass = computed(() => statusClassMap[status.value] || 'status-chip-unknown')

const updateNodeLog = (nodeName, updates) => {
  const idx = nodeLogs.value.findIndex((log) => log.node === nodeName)
  if (idx !== -1) {
    nodeLogs.value[idx] = { ...nodeLogs.value[idx], ...updates }
  }
}

const appendReviewFeedback = (payload) => {
  const text = String(payload?.feedback ?? '').trim()
  if (!text) {
    return
  }

  const passed = Boolean(payload?.passed)
  const identity = `${passed ? 'pass' : 'fail'}:${text}`
  if (reviewFeedbacks.value.some((item) => item.identity === identity)) {
    return
  }

  reviewFeedbacks.value.unshift({
    id: Date.now() + reviewFeedbacks.value.length,
    identity,
    time: new Date().toLocaleTimeString(),
    text
  })
}

const applyTaskSnapshot = (taskData) => {
  status.value = taskData.status
  globalError.value = taskData.error || ''

  if (taskData.result) {
    finalResult.value = taskData.result
  }

  if (taskData.node_logs && taskData.node_logs.length) {
    taskData.node_logs.forEach((remoteLog) => {
      const nextStatus = remoteLog.status === 'error'
        ? 'failed'
        : remoteLog.status

      updateNodeLog(remoteLog.node, {
        status: nextStatus,
        message: remoteLog.message || (remoteLog.status === 'done' ? '完成' : '等待中'),
        duration: remoteLog.duration_ms
      })

      if (remoteLog.node === 'content_reviewer' && remoteLog.review_passed === false && remoteLog.message) {
        appendReviewFeedback({
          passed: false,
          feedback: remoteLog.message
        })
      }
    })
  }
}

const disconnectSse = () => {
  if (sseClient) {
    sseClient.disconnect()
    sseClient = null
  }
}

const stopStatusPolling = () => {
  if (statusPollingTimer) {
    window.clearInterval(statusPollingTimer)
    statusPollingTimer = null
  }
}

const syncTaskSnapshot = async ({ silent = false } = {}) => {
  if (isSyncingSnapshot) {
    return
  }

  isSyncingSnapshot = true

  try {
    const taskData = await api.getTaskStatus(taskId)
    const previousStatus = status.value

    applyTaskSnapshot(taskData)

    if (previousStatus === 'processing' && status.value === 'completed') {
      await userStore.fetchCurrentUser()
    }

    if (status.value !== 'processing') {
      stopStatusPolling()
      disconnectSse()
    }
  } catch (err) {
    if (!silent) {
      console.warn('Pulling status failed, falling back to SSE only.', err)
    }
  } finally {
    isSyncingSnapshot = false
  }
}

const startStatusPolling = () => {
  stopStatusPolling()

  // 设计意图：详情页重进后不能只依赖 SSE，轮询作为兜底可覆盖跨页面、跨进程或事件总线短暂失联场景。
  statusPollingTimer = window.setInterval(() => {
    if (status.value !== 'processing') {
      stopStatusPolling()
      return
    }

    syncTaskSnapshot({ silent: true })
  }, 3000)
}

const initTasks = async () => {
  await syncTaskSnapshot()

  if (status.value === 'processing') {
    sseClient = new SSEClient(
      taskId,
      (type, data) => handleSseEvent(type, data),
      (err) => {
        console.error('SSE connection crashed', err)
      }
    )
    sseClient.connect()
    startStatusPolling()
  }
}

const handleSseEvent = (type, data) => {
  switch (type) {
    case 'node_start':
      updateNodeLog(data.node, { status: 'running', message: data.message })
      break

    case 'node_complete':
      updateNodeLog(data.node, {
        status: 'done',
        message: '完成',
        duration: data.duration_ms
      })
      break

    case 'review_feedback':
      if (!data.passed) {
        appendReviewFeedback(data)
        updateNodeLog('content_reviewer', { message: '审查打回，触发重写' })
        updateNodeLog('content_optimizer', { status: 'pending', message: '准备重新优化...' })
      } else {
        updateNodeLog('content_reviewer', { message: '审查通过' })
      }
      break

    case 'complete':
      status.value = 'completed'
      stopStatusPolling()
      disconnectSse()
      setTimeout(async () => {
        try {
          await syncTaskSnapshot({ silent: true })

          // 设计意图：任务成功后后端会立即完成扣费，这里顺手刷新当前用户，
          // 让顶部额度展示与真实余额保持同步，而不要求用户手动刷新页面。
          await userStore.fetchCurrentUser()
        } catch (e) {
          console.error('Failed to load final result', e)
        }
      }, 500)
      break

    case 'error':
      status.value = 'failed'
      globalError.value = data.error
      stopStatusPolling()
      disconnectSse()
      break

    case 'heartbeat':
      break
  }
}

const exportPdf = () => {
  window.print()
}

const exportWord = () => {
  exportingWord.value = true

  api.downloadWord(taskId)
    .catch((error) => {
      globalError.value = error.message || '导出 Word 失败，请稍后重试。'
    })
    .finally(() => {
      exportingWord.value = false
    })
}

onMounted(() => {
  initTasks()
})

onUnmounted(() => {
  stopStatusPolling()
  disconnectSse()
})
</script>

<style scoped>
.task-process-page {
  padding-top: 0.35rem;
}

.task-process-hero__row {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.task-process-hero__intro {
  max-width: 38rem;
}

.task-process-title {
  color: var(--color-text-strong);
}

.task-process-hero__meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.task-process-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.task-process-accent-icon {
  color: var(--color-primary);
}

.task-process-error {
  background: color-mix(in srgb, var(--color-danger) 8%, var(--color-bg-card) 92%);
  border-color: color-mix(in srgb, var(--color-danger) 18%, var(--color-border) 82%);
}

.task-process-error__heading {
  color: var(--color-danger);
}

.task-process-error__copy {
  color: color-mix(in srgb, var(--color-danger) 82%, var(--color-text-main) 18%);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (min-width: 1024px) {
  .task-process-hero__row {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .task-process-hero__meta {
    align-items: flex-end;
  }
}
</style>
