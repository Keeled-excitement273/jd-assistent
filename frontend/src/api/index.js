import axios from 'axios'
import { clearStoredAuth, getStoredAccessToken } from '../stores/user'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // 鉴权失效后立即清空本地状态，避免前端继续带着过期 token 重试。
      clearStoredAuth()

      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/login?redirect=${redirect}`)
      }
    }

    return Promise.reject(error)
  }
)

const extractErrorMessage = (error, fallback) => {
  return error?.response?.data?.detail || error?.response?.data?.message || error?.message || fallback
}

const createApiError = (error, fallback) => {
  const wrapped = new Error(extractErrorMessage(error, fallback))
  wrapped.status = error?.response?.status ?? 0
  wrapped.payload = error?.response?.data ?? null
  return wrapped
}

const triggerBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

const defaultDashboardSummary = () => ({
  totalTasks: 0,
  completedTasks: 0,
  processingTasks: 0,
  failedTasks: 0,
  totalTokens: 0,
  totalLlmCostUsd: 0
})

const normalizeDashboardMetric = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeAdminStats = (payload) => ({
  totalUsers: normalizeDashboardMetric(payload?.total_users ?? payload?.totalUsers),
  totalTasks: normalizeDashboardMetric(payload?.total_tasks ?? payload?.totalTasks),
  completedTasks: normalizeDashboardMetric(payload?.completed_tasks ?? payload?.completedTasks),
  failedTasks: normalizeDashboardMetric(payload?.failed_tasks ?? payload?.failedTasks),
  activeUsers7d: normalizeDashboardMetric(payload?.active_users_7d ?? payload?.activeUsers7d),
  llmCostUsd: normalizeDashboardMetric(payload?.llm_cost_usd ?? payload?.llmCostUsd)
})

const normalizeAdminUserItem = (item) => ({
  id: item?.id ?? '',
  email: item?.email ?? '未知邮箱',
  authProvider: item?.auth_provider ?? item?.authProvider ?? 'unknown',
  credits: normalizeDashboardMetric(item?.credits),
  tier: item?.tier ?? 'free',
  createdAt: item?.created_at ?? item?.createdAt ?? null,
  isAdmin: Boolean(item?.is_admin ?? item?.isAdmin)
})

const normalizeAdminTaskItem = (item) => ({
  taskId: item?.task_id ?? item?.taskId ?? '',
  userId: item?.user_id ?? item?.userId ?? '',
  userEmail: item?.user_email ?? item?.userEmail ?? '未知用户',
  status: normalizeHistoryStatus(item?.status),
  originalFile: item?.original_file ?? item?.originalFile ?? '',
  createdAt: item?.created_at ?? item?.createdAt ?? null,
  completedAt: item?.completed_at ?? item?.completedAt ?? null,
  error: item?.error ?? ''
})

const clampPercentage = (value) => {
  const parsed = normalizeDashboardMetric(value)
  return Math.min(100, Math.max(0, parsed))
}

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }

      if (item && typeof item === 'object') {
        return String(item.label ?? item.name ?? item.title ?? item.value ?? '').trim()
      }

      return ''
    })
    .filter(Boolean)
}

const normalizeHistoryStatus = (status) => {
  const normalizedStatus = String(status || 'unknown').toLowerCase()

  if (['completed', 'done', 'success', 'finished'].includes(normalizedStatus)) {
    return 'completed'
  }

  if (['processing', 'running', 'queued', 'pending', 'in_progress'].includes(normalizedStatus)) {
    return 'processing'
  }

  if (['failed', 'error', 'cancelled', 'canceled'].includes(normalizedStatus)) {
    return 'failed'
  }

  return 'unknown'
}

const normalizeHistoryItem = (item, index) => {
  if (!item || typeof item !== 'object') {
    return {
      id: `history-${index}`,
      title: '未命名任务',
      status: 'unknown',
      createdAt: '',
      updatedAt: '',
      originalFile: '',
      durationMs: null,
      totalTokens: 0,
      llmCostUsd: 0,
      error: '',
      documentReady: false
    }
  }

  const normalizedStatus = normalizeHistoryStatus(item.status)

  return {
    id: item.id ?? item.task_id ?? `history-${index}`,
    title: item.original_file ?? item.originalFile ?? item.title ?? item.resume_name ?? item.name ?? '未命名任务',
    status: normalizedStatus,
    createdAt: item.created_at ?? item.createdAt ?? item.submitted_at ?? '',
    updatedAt: item.completed_at ?? item.completedAt ?? item.updated_at ?? item.updatedAt ?? item.finished_at ?? '',
    originalFile: item.original_file ?? item.originalFile ?? '',
    durationMs: item.duration_ms ?? item.durationMs ?? null,
    totalTokens: normalizeDashboardMetric(item.total_tokens ?? item.totalTokens),
    llmCostUsd: normalizeDashboardMetric(item.llm_cost_usd ?? item.llmCostUsd),
    error: item.error ?? '',
    documentReady: normalizedStatus === 'completed'
  }
}

const normalizeCreditChartPoint = (point, index) => {
  if (!point || typeof point !== 'object') {
    return {
      id: `credit-point-${index}`,
      label: `第 ${index + 1} 天`,
      shortLabel: `${index + 1}`,
      value: 0,
      hint: ''
    }
  }

  const label = String(point.label ?? point.date ?? point.name ?? point.period ?? `第 ${index + 1} 天`)
  const balanceValue = normalizeDashboardMetric(
    point.balance
    ?? point.current_credits
    ?? point.currentCredits
    ?? point.value
  )
  const deltaValue = normalizeDashboardMetric(point.delta)
  const chargedTasks = normalizeDashboardMetric(point.charged_tasks ?? point.chargedTasks)
  const llmTokens = normalizeDashboardMetric(point.llm_tokens ?? point.llmTokens)
  const llmCostUsd = normalizeDashboardMetric(point.total_llm_cost_usd ?? point.totalLlmCostUsd)
  const reason = String(point.reason ?? '').trim()
  const defaultHint = reason
    ? `${reason} · 余额 ${balanceValue} 点${Number.isFinite(Number(point.delta)) ? ` · 变动 ${deltaValue > 0 ? '+' : ''}${deltaValue}` : ''}`
    : `${chargedTasks} 个计费任务 · ${llmTokens} tokens · $${llmCostUsd.toFixed(4)}`

  return {
    id: point.id ?? `credit-point-${index}`,
    label,
    shortLabel: String(point.short_label ?? point.shortLabel ?? point.abbr ?? label.slice(5) ?? label),
    value: balanceValue,
    hint: String(
      point.hint
      ?? point.note
      ?? point.tooltip
      ?? defaultHint
    )
  }
}

const defaultCreditChart = () => ({
  title: '近 7 天额度余额变化',
  summary: '这里展示最近 7 天（含今天截至当前）的按日额度余额变化，帮助你快速判断每天的额度波动。',
  currentCredits: 0,
  deltaText: '暂无额度变化',
  points: []
})

const normalizeCreditChart = (payload) => {
  const rawPoints = payload?.series ?? payload?.points ?? payload?.items ?? payload?.history ?? payload?.data ?? []
  const points = Array.isArray(rawPoints) ? rawPoints.map(normalizeCreditChartPoint) : []
  const lastValue = points.at(-1)?.value ?? 0
  const previousValue = points.at(-2)?.value ?? lastValue
  const lastRawPoint = Array.isArray(rawPoints) ? rawPoints.at(-1) : null
  const deltaValue = Number.isFinite(Number(lastRawPoint?.delta))
    ? Number(lastRawPoint.delta)
    : lastValue - previousValue
  const metricBasis = String(payload?.metric_basis ?? payload?.metricBasis ?? '').trim().toLowerCase()
  const isBalanceHistory = metricBasis === 'balance_history'

  return {
    ...defaultCreditChart(),
    title: payload?.title ?? payload?.name ?? (isBalanceHistory ? '近 7 天额度余额变化' : '额度消耗趋势'),
    summary: payload?.summary
      ?? payload?.description
      ?? (isBalanceHistory
        ? '这里展示最近 7 天（含今天截至当前）的按日真实额度余额变化，方便你判断每天的额度波动。'
        : '最近的扣费任务会聚合成一条轻量趋势线，便于你判断使用节奏。'),
    currentCredits: normalizeDashboardMetric(
      payload?.current_credits ?? payload?.currentCredits ?? payload?.remaining_credits ?? payload?.remainingCredits ?? lastValue
    ),
    deltaText: payload?.delta_text ?? payload?.deltaText ?? (deltaValue === 0
      ? (isBalanceHistory ? '最近一条记录没有额度变化' : '与上一条消耗记录持平')
      : deltaValue > 0
        ? (isBalanceHistory ? `最近一次回补 ${deltaValue} 点` : `较上次多消耗 ${deltaValue} 点`)
        : (isBalanceHistory ? `最近一次扣减 ${Math.abs(deltaValue)} 点` : `较上次少消耗 ${Math.abs(deltaValue)} 点`)),
    points
  }
}

const defaultProfileSummary = () => ({
  title: '候选人画像摘要',
  summary: '这里展示当前账号下已持久化的真实画像摘要和任务聚合情况。',
  completionRate: 0,
  targetRole: '真实画像尚未生成',
  strengths: [],
  nextActions: [],
  keywords: []
})

const normalizeProfileSummary = (payload) => {
  const totalTasks = normalizeDashboardMetric(payload?.total_tasks ?? payload?.totalTasks)
  const completedTasks = normalizeDashboardMetric(payload?.completed_tasks ?? payload?.completedTasks)
  const failedTasks = normalizeDashboardMetric(payload?.failed_tasks ?? payload?.failedTasks)
  const processingTasks = normalizeDashboardMetric(payload?.processing_tasks ?? payload?.processingTasks)
  const experienceCount = normalizeDashboardMetric(payload?.experience_count ?? payload?.experienceCount)
  const educationCount = normalizeDashboardMetric(payload?.education_count ?? payload?.educationCount)
  const topSkillCategories = normalizeStringList(payload?.top_skill_categories ?? payload?.topSkillCategories)
  const profileReady = Boolean(payload?.profile_ready ?? payload?.profileReady)
  const completionRate = profileReady ? 100 : 0
  const profileAssetText = profileReady
    ? `${experienceCount} 段经历 / ${educationCount} 条教育 / ${topSkillCategories.length} 个技能簇`
    : '等待首次画像落库'

  return {
    ...defaultProfileSummary(),
    title: profileReady ? '真实画像已入库' : '候选人画像摘要',
    summary: payload?.summary
      ?? payload?.overview
      ?? (profileReady
        ? `当前账号下的真实画像资产已经落库，可复用 ${experienceCount} 段经历、${educationCount} 条教育与 ${topSkillCategories.length} 个技能簇。`
        : '当前账号还没有可复用的画像快照，完成一次优化任务后会自动沉淀真实画像摘要。'),
    completionRate: clampPercentage(payload?.completion_rate ?? payload?.completionRate ?? completionRate),
    targetRole: payload?.target_role ?? payload?.targetRole ?? profileAssetText,
    strengths: topSkillCategories.length
      ? topSkillCategories.map((item) => `${item} 技能簇已具备可复用画像素材`)
      : [],
    nextActions: profileReady
      ? [
          processingTasks > 0 ? `还有 ${processingTasks} 个任务正在处理中，可等待更多画像样本写入。` : '可以继续提交新任务，持续扩充画像样本。',
          failedTasks > 0 ? `有 ${failedTasks} 个失败任务，建议先回看执行日志再补充画像。` : `当前已完成 ${completedTasks}/${totalTasks || completedTasks} 个任务，可继续沉淀稳定样本。`
        ]
      : ['先完成一条优化任务，让画像节点沉淀可复用素材。'],
    keywords: topSkillCategories
  }
}

const normalizeDashboardPayload = (payload) => {
  const rawSummary = payload?.summary ?? payload?.metrics ?? {}
  const rawHistory = payload?.recent_tasks ?? payload?.history ?? payload?.tasks ?? payload?.items ?? []
  const rawCreditChart = payload?.credit_chart ?? payload?.creditChart ?? {}
  const rawProfileSummary = payload?.profile_summary ?? payload?.profileSummary ?? {}
  const completedTasks = normalizeDashboardMetric(rawSummary.completed_tasks ?? rawSummary.completedTasks)
  const processingTasks = normalizeDashboardMetric(rawSummary.processing_tasks ?? rawSummary.processingTasks)
  const failedTasks = normalizeDashboardMetric(rawSummary.failed_tasks ?? rawSummary.failedTasks)
  const totalTasks = normalizeDashboardMetric(
    rawSummary.total_tasks ?? rawSummary.totalTasks ?? completedTasks + processingTasks + failedTasks
  )
  const normalizedSummary = {
    ...defaultDashboardSummary(),
    totalTasks,
    completedTasks,
    processingTasks,
    failedTasks,
    totalTokens: normalizeDashboardMetric(rawSummary.total_tokens ?? rawSummary.totalTokens),
    totalLlmCostUsd: normalizeDashboardMetric(rawSummary.total_llm_cost_usd ?? rawSummary.totalLlmCostUsd)
  }

  return {
    summary: normalizedSummary,
    history: Array.isArray(rawHistory) ? rawHistory.map(normalizeHistoryItem) : [],
    creditChart: normalizeCreditChart(rawCreditChart),
    profileSummary: normalizeProfileSummary(rawProfileSummary)
  }
}

export default {
  /**
   * 提交简历优化任务
   * @param {File} resume_file 原始简历文件
   * @param {string} jd_text 岗位的 JD
   * @returns {Promise<{task_id: string, status: string, message: string}>}
   */
  async submitOptimizeTask(resume_file, jd_text) {
    const formData = new FormData()
    formData.append('resume_file', resume_file)
    formData.append('jd_text', jd_text)
    
    // axios 会自动识别 FormData 并设置正确的 multipart/form-data header
    try {
      const response = await apiClient.post('/optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw createApiError(error, '提交任务失败，请稍后重试')
    }
  },

  /**
   * 获取任务当前状态
   * @param {string} task_id
   * @returns {Promise<any>}
   */
  async getTaskStatus(task_id) {
    try {
      const response = await apiClient.get(`/tasks/${task_id}`)
      return response.data
    } catch (error) {
      throw createApiError(error, '获取任务状态失败，请稍后刷新页面')
    }
  },

  /**
   * 下载 Word 文档
   * @param {string} task_id 
   */
  async downloadWord(task_id) {
    try {
      const response = await apiClient.get(`/export/docx/${task_id}`, {
        responseType: 'blob'
      })

      triggerBlobDownload(response.data, `optimized-resume-${task_id}.docx`)
    } catch (error) {
      throw createApiError(error, '导出 Word 失败，请稍后重试')
    }
  },

  /**
   * 获取仪表盘摘要与任务历史。
    * 设计意图：对后端 snake_case 契约做一次前端归一化，避免视图层充斥字段兼容逻辑。
     * @returns {Promise<{summary: {totalTasks: number, completedTasks: number, processingTasks: number, failedTasks: number, totalTokens: number, totalLlmCostUsd: number}, history: Array, creditChart: Object, profileSummary: Object}>}
     */
  async getDashboardSnapshot() {
     try {
       const response = await apiClient.get('/dashboard')

       return normalizeDashboardPayload(response.data)
     } catch (error) {
       throw createApiError(error, '获取工作台数据失败，请稍后重试')
     }
  },

  async getAdminStats() {
    try {
      const response = await apiClient.get('/admin/stats')
      return normalizeAdminStats(response.data)
    } catch (error) {
      throw createApiError(error, '获取管理员统计失败，请稍后重试')
    }
  },

  async getAdminUsers({ page = 1, pageSize = 20, email = '', tier = '', isAdmin = null } = {}) {
    try {
      const response = await apiClient.get('/admin/users', {
        params: {
          page,
          page_size: pageSize,
          ...(email ? { email } : {}),
          ...(tier ? { tier } : {}),
          ...(typeof isAdmin === 'boolean' ? { is_admin: isAdmin } : {})
        }
      })

      return {
        items: Array.isArray(response.data?.items) ? response.data.items.map(normalizeAdminUserItem) : [],
        total: normalizeDashboardMetric(response.data?.total),
        page: normalizeDashboardMetric(response.data?.page || page),
        pageSize: normalizeDashboardMetric(response.data?.page_size ?? response.data?.pageSize ?? pageSize)
      }
    } catch (error) {
      throw createApiError(error, '获取管理员用户列表失败，请稍后重试')
    }
  },

  async getAdminTasks({ page = 1, pageSize = 20, status = '', userEmail = '', originalFile = '' } = {}) {
    try {
      const response = await apiClient.get('/admin/tasks', {
        params: {
          page,
          page_size: pageSize,
          ...(status ? { status } : {}),
          ...(userEmail ? { user_email: userEmail } : {}),
          ...(originalFile ? { original_file: originalFile } : {})
        }
      })

      return {
        items: Array.isArray(response.data?.items) ? response.data.items.map(normalizeAdminTaskItem) : [],
        total: normalizeDashboardMetric(response.data?.total),
        page: normalizeDashboardMetric(response.data?.page || page),
        pageSize: normalizeDashboardMetric(response.data?.page_size ?? response.data?.pageSize ?? pageSize)
      }
    } catch (error) {
      throw createApiError(error, '获取管理员任务列表失败，请稍后重试')
    }
  },

  async adjustAdminUserCredits(userId, { delta, reason }) {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/credits`, {
        delta,
        reason
      })

      return {
        id: response.data?.id ?? '',
        email: response.data?.email ?? '',
        authProvider: response.data?.auth_provider ?? response.data?.authProvider ?? 'unknown',
        credits: normalizeDashboardMetric(response.data?.credits),
        tier: response.data?.tier ?? 'free',
        isAdmin: Boolean(response.data?.is_admin ?? response.data?.isAdmin)
      }
    } catch (error) {
      throw createApiError(error, '调整用户额度失败，请稍后重试')
    }
  }
}
