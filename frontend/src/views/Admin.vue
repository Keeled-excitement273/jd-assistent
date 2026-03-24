<template>
  <div class="container mx-auto px-4">
    <div class="admin-shell mx-auto max-w-6xl space-y-8">
      <section class="surface-panel admin-hero px-6 py-8 md:px-8 md:py-10">
        <div class="admin-hero__grid">
          <div>
            <p class="eyebrow">管理后台</p>
            <h1 class="page-heading mt-4 text-3xl sm:text-4xl">平台运行概览与管理视角</h1>
            <p class="page-copy mt-4 max-w-2xl text-sm sm:text-base">
              这里聚合平台用户、任务和活跃度信息，方便管理员快速查看系统运行情况，并定位需要关注的账号与任务。
            </p>
          </div>

          <aside class="admin-note">
            <p class="admin-note__label">权限说明</p>
            <p class="admin-note__copy">
              当前页面仅对管理员邮箱白名单开放。普通登录用户不会看到入口，也不能直接访问此页面。
            </p>
          </aside>
        </div>
      </section>

      <section v-if="errorMessage" class="surface-panel admin-error px-6 py-5" aria-live="assertive">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="admin-error__title text-base font-semibold">{{ errorTitle }}</h2>
            <p class="admin-error__copy mt-1 text-sm leading-6">{{ errorMessage }}</p>
          </div>
          <button type="button" class="btn btn-secondary min-h-[44px] px-5" @click="loadAdminData">
            重新加载
          </button>
        </div>
      </section>

      <section>
        <div class="admin-section-head">
          <div>
            <p class="eyebrow">平台统计</p>
            <h2 class="page-heading mt-2 text-2xl">关键运营指标</h2>
          </div>
          <p class="page-copy hidden text-sm md:block">先看总量，再看具体用户和任务列表。</p>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article v-for="metric in statsCards" :key="metric.key" class="surface-panel admin-metric p-5">
            <p class="admin-metric__label text-xs font-semibold uppercase tracking-[0.18em]">{{ metric.label }}</p>
            <p v-if="loading" class="skeleton-block mt-4 h-9 w-20 rounded"></p>
            <p v-else class="admin-metric__value mt-4 text-3xl tracking-tight">{{ metric.value }}</p>
            <p class="admin-metric__description mt-4 text-sm leading-6">{{ metric.description }}</p>
          </article>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section class="surface-panel admin-panel p-6 md:p-7" aria-labelledby="admin-users-heading">
          <div class="admin-panel__head">
            <div>
              <p class="eyebrow">用户列表</p>
              <h2 id="admin-users-heading" class="page-heading mt-2 text-2xl">最近用户</h2>
            </div>
            <p class="admin-panel__meta text-sm">共 {{ users.total }} 个用户</p>
          </div>

          <div class="admin-filter-bar mt-5">
            <input v-model.trim="userFilters.email" class="form-control admin-filter-input" type="text" placeholder="按邮箱筛选">
            <select v-model="userFilters.tier" class="form-control admin-filter-input">
              <option value="">全部套餐</option>
              <option value="free">基础版</option>
              <option value="pro">专业版</option>
              <option value="plus">高级版</option>
              <option value="enterprise">企业版</option>
            </select>
            <select v-model="userFilters.isAdmin" class="form-control admin-filter-input">
              <option value="">全部权限</option>
              <option value="true">仅管理员</option>
              <option value="false">仅普通用户</option>
            </select>
            <button type="button" class="btn btn-secondary !px-4 text-sm" @click="applyUserFilters">筛选</button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="index in 4" :key="index" class="skeleton-block h-16 rounded-2xl"></div>
          </div>

          <div v-else-if="users.items.length === 0" class="admin-empty mt-5">
            当前还没有可展示的用户数据。
          </div>

          <ol v-else class="mt-5 space-y-3">
            <li v-for="user in users.items" :key="user.id" class="admin-list-card">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="admin-list-card__title truncate">{{ user.email }}</h3>
                  <p class="admin-list-card__meta mt-1 text-sm">
                    {{ user.tier }} · {{ user.authProvider }} · 创建于 {{ formatDate(user.createdAt) }}
                  </p>
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <span class="status-chip status-chip-unknown">{{ user.credits }} 点</span>
                  <span v-if="user.isAdmin" class="status-chip status-chip-completed">管理员</span>
                </div>
              </div>

              <form class="admin-credit-form mt-4" @submit.prevent="submitCreditAdjustment(user)">
                <input v-model.number="creditDrafts[user.id].delta" class="form-control admin-credit-form__delta" type="number" step="1" placeholder="额度变化值">
                <input v-model.trim="creditDrafts[user.id].reason" class="form-control admin-credit-form__reason" type="text" maxlength="200" placeholder="调整原因">
                <button type="submit" class="btn btn-primary !px-4 text-sm" :disabled="Boolean(creditDrafts[user.id].submitting)">
                  {{ creditDrafts[user.id].submitting ? '提交中...' : '调整额度' }}
                </button>
              </form>
              <p v-if="creditDrafts[user.id].message" class="admin-inline-feedback mt-2 text-sm" :class="{ 'admin-inline-feedback--error': creditDrafts[user.id].isError }">
                {{ creditDrafts[user.id].message }}
              </p>
            </li>
          </ol>

          <div class="admin-pagination mt-5">
            <button type="button" class="btn btn-secondary !px-4 text-sm" :disabled="users.page <= 1 || loading" @click="changeUsersPage(users.page - 1)">上一页</button>
            <span class="admin-pagination__meta text-sm">第 {{ users.page }} / {{ usersTotalPages }} 页</span>
            <button type="button" class="btn btn-secondary !px-4 text-sm" :disabled="users.page >= usersTotalPages || loading" @click="changeUsersPage(users.page + 1)">下一页</button>
          </div>
        </section>

        <section class="surface-panel admin-panel p-6 md:p-7" aria-labelledby="admin-tasks-heading">
          <div class="admin-panel__head">
            <div>
              <p class="eyebrow">任务列表</p>
              <h2 id="admin-tasks-heading" class="page-heading mt-2 text-2xl">最近任务</h2>
            </div>
            <p class="admin-panel__meta text-sm">共 {{ tasks.total }} 条任务</p>
          </div>

          <div class="admin-filter-bar mt-5">
            <select v-model="taskFilters.status" class="form-control admin-filter-input">
              <option value="">全部状态</option>
              <option value="processing">进行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
            <input v-model.trim="taskFilters.userEmail" class="form-control admin-filter-input" type="text" placeholder="按用户邮箱筛选">
            <input v-model.trim="taskFilters.originalFile" class="form-control admin-filter-input" type="text" placeholder="按文件名筛选">
            <button type="button" class="btn btn-secondary !px-4 text-sm" @click="applyTaskFilters">筛选</button>
          </div>

          <div v-if="loading" class="mt-5 space-y-3">
            <div v-for="index in 4" :key="index" class="skeleton-block h-16 rounded-2xl"></div>
          </div>

          <div v-else-if="tasks.items.length === 0" class="admin-empty mt-5">
            当前还没有可展示的任务数据。
          </div>

          <ol v-else class="mt-5 space-y-3">
            <li v-for="task in tasks.items" :key="task.taskId" class="admin-list-card">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="admin-list-card__title truncate">{{ task.originalFile || '未记录文件名' }}</h3>
                  <p class="admin-list-card__meta mt-1 text-sm">
                    {{ task.userEmail }} · 提交于 {{ formatDate(task.createdAt) }}
                  </p>
                  <p v-if="task.error" class="admin-list-card__error mt-2 text-sm">{{ task.error }}</p>
                </div>
                <div class="flex flex-wrap justify-end gap-2">
                  <span class="status-chip" :class="statusClassMap[task.status] || statusClassMap.unknown">
                    {{ statusTextMap[task.status] || statusTextMap.unknown }}
                  </span>
                  <router-link :to="`/task/${task.taskId}`" class="btn btn-secondary !px-4 text-xs">
                    查看
                  </router-link>
                </div>
              </div>
            </li>
          </ol>

          <div class="admin-pagination mt-5">
            <button type="button" class="btn btn-secondary !px-4 text-sm" :disabled="tasks.page <= 1 || loading" @click="changeTasksPage(tasks.page - 1)">上一页</button>
            <span class="admin-pagination__meta text-sm">第 {{ tasks.page }} / {{ tasksTotalPages }} 页</span>
            <button type="button" class="btn btn-secondary !px-4 text-sm" :disabled="tasks.page >= tasksTotalPages || loading" @click="changeTasksPage(tasks.page + 1)">下一页</button>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const loading = ref(true)
const errorMessage = ref('')
const errorTitle = ref('管理员数据暂时不可用')

const stats = reactive({
  totalUsers: 0,
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  activeUsers7d: 0,
  llmCostUsd: 0
})

const users = reactive({
  items: [],
  total: 0,
  page: 1,
  pageSize: 12
})

const userFilters = reactive({
  email: '',
  tier: '',
  isAdmin: ''
})

const tasks = reactive({
  items: [],
  total: 0,
  page: 1,
  pageSize: 12
})

const taskFilters = reactive({
  status: '',
  userEmail: '',
  originalFile: ''
})

const creditDrafts = reactive({})

const statusTextMap = {
  completed: '已完成',
  processing: '进行中',
  failed: '失败',
  unknown: '状态未知'
}

const statusClassMap = {
  completed: 'status-chip-completed',
  processing: 'status-chip-processing',
  failed: 'status-chip-failed',
  unknown: 'status-chip-unknown'
}

const statsCards = computed(() => [
  {
    key: 'totalUsers',
    label: '总用户数',
    value: stats.totalUsers,
    description: '当前系统中已注册的用户总量。'
  },
  {
    key: 'totalTasks',
    label: '总任务数',
    value: stats.totalTasks,
    description: '累计创建的优化任务数量。'
  },
  {
    key: 'completedTasks',
    label: '完成任务',
    value: stats.completedTasks,
    description: '已生成结果并完成流程的任务数量。'
  },
  {
    key: 'failedTasks',
    label: '失败任务',
    value: stats.failedTasks,
    description: '需要回看日志或排查链路的问题任务。'
  },
  {
    key: 'activeUsers7d',
    label: '7日活跃用户',
    value: stats.activeUsers7d,
    description: `近 7 天有提交任务行为的用户，累计模型成本 $${stats.llmCostUsd.toFixed(4)}。`
  }
])

const usersTotalPages = computed(() => Math.max(1, Math.ceil(users.total / users.pageSize || 1)))
const tasksTotalPages = computed(() => Math.max(1, Math.ceil(tasks.total / tasks.pageSize || 1)))

const ensureCreditDraft = (userId) => {
  if (!creditDrafts[userId]) {
    creditDrafts[userId] = {
      delta: 0,
      reason: '',
      submitting: false,
      message: '',
      isError: false
    }
  }

  return creditDrafts[userId]
}

const formatDate = (value) => {
  if (!value) return '待后端补充'
  const timestamp = Number(value)
  const date = Number.isFinite(timestamp) ? new Date(timestamp * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return '时间待校验'

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const loadAdminData = async () => {
  loading.value = true
  errorMessage.value = ''
  errorTitle.value = '管理员数据暂时不可用'

  try {
    const [statsPayload, usersPayload, tasksPayload] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers({
        page: users.page,
        pageSize: users.pageSize,
        email: userFilters.email,
        tier: userFilters.tier,
        isAdmin: userFilters.isAdmin === '' ? null : userFilters.isAdmin === 'true'
      }),
      api.getAdminTasks({
        page: tasks.page,
        pageSize: tasks.pageSize,
        status: taskFilters.status,
        userEmail: taskFilters.userEmail,
        originalFile: taskFilters.originalFile
      })
    ])

    Object.assign(stats, statsPayload)
    Object.assign(users, usersPayload)
    Object.assign(tasks, tasksPayload)

    users.items.forEach((user) => ensureCreditDraft(user.id))
  } catch (error) {
    errorTitle.value = error?.status === 403 || !userStore.isAdmin ? '当前账号没有管理员权限' : '管理员数据暂时不可用'
    errorMessage.value = error?.status === 403 || !userStore.isAdmin
      ? '你的账号当前不具备管理员访问权限。请确认邮箱已加入管理员白名单后重新登录。'
      : error?.message || '加载管理员数据失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

const applyUserFilters = async () => {
  users.page = 1
  await loadAdminData()
}

const applyTaskFilters = async () => {
  tasks.page = 1
  await loadAdminData()
}

const changeUsersPage = async (page) => {
  users.page = page
  await loadAdminData()
}

const changeTasksPage = async (page) => {
  tasks.page = page
  await loadAdminData()
}

const submitCreditAdjustment = async (user) => {
  const draft = ensureCreditDraft(user.id)
  draft.message = ''
  draft.isError = false

  if (!Number.isFinite(draft.delta) || draft.delta === 0) {
    draft.message = '请输入非 0 的额度变化值。'
    draft.isError = true
    return
  }

  if (!draft.reason || draft.reason.length < 2) {
    draft.message = '请填写至少 2 个字的调整原因。'
    draft.isError = true
    return
  }

  draft.submitting = true
  try {
    const updatedUser = await api.adjustAdminUserCredits(user.id, {
      delta: Number(draft.delta),
      reason: draft.reason
    })

    const matchedUser = users.items.find((item) => item.id === user.id)
    if (matchedUser) {
      Object.assign(matchedUser, updatedUser)
    }

    draft.message = `额度已更新为 ${updatedUser.credits} 点。`
    draft.isError = false
    draft.delta = 0
    draft.reason = ''

    if (updatedUser.id && updatedUser.id === userStore.user?.id) {
      await userStore.fetchCurrentUser()
    }
  } catch (error) {
    draft.message = error?.message || '额度调整失败，请稍后重试。'
    draft.isError = true
  } finally {
    draft.submitting = false
  }
}

onMounted(() => {
  loadAdminData()
})
</script>

<style scoped>
.admin-shell {
  color: var(--color-text-main);
}

.admin-hero__grid {
  display: grid;
  gap: 1.5rem;
}

.admin-note {
  max-width: 24rem;
  padding-left: 1rem;
  border-left: 1px solid color-mix(in srgb, var(--color-border-strong) 72%, white 28%);
}

.admin-note__label {
  display: inline-block;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.admin-note__copy,
.admin-panel__meta,
.admin-list-card__meta,
.admin-metric__description {
  color: var(--color-text-muted);
}

.admin-note__copy {
  margin-top: 0.65rem;
  font-size: 0.92rem;
  line-height: 1.8;
}

.admin-section-head,
.admin-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.admin-metric {
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 95%, white 5%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
}

.admin-metric__label {
  color: var(--color-text-muted);
}

.admin-metric__value {
  color: var(--color-text-strong);
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1;
}

.admin-panel {
  min-height: 100%;
}

.admin-filter-bar {
  display: grid;
  gap: 0.75rem;
}

.admin-filter-input {
  min-height: 2.75rem;
}

.admin-list-card,
.admin-empty {
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 94%, white 6%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
  border-radius: 1.5rem;
  padding: 1rem 1.1rem;
}

.admin-credit-form {
  display: grid;
  gap: 0.75rem;
}

.admin-inline-feedback {
  color: var(--color-accent);
}

.admin-inline-feedback--error {
  color: var(--color-danger);
}

.admin-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.admin-pagination__meta {
  color: var(--color-text-muted);
}

.admin-list-card__title,
.admin-error__title {
  color: var(--color-text-strong);
  font-weight: 700;
}

.admin-list-card__error,
.admin-error__copy {
  color: var(--color-danger);
}

.admin-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 18%, white 82%);
  background: color-mix(in srgb, var(--color-danger) 8%, white 92%);
}

@media (min-width: 1024px) {
  .admin-hero__grid {
    grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
    align-items: end;
  }

  .admin-filter-bar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .admin-credit-form {
    grid-template-columns: 9rem minmax(0, 1fr) auto;
    align-items: center;
  }
}
</style>
