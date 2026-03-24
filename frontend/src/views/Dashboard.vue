<template>
  <div class="container mx-auto px-4">
    <div class="dashboard-shell mx-auto max-w-6xl space-y-8">
      <section class="surface-panel dashboard-hero px-6 py-8 md:px-8 md:py-10">
        <div class="grid gap-6 lg:grid-cols-[1.45fr_0.95fr] lg:items-start">
          <div>
            <p class="dashboard-kicker eyebrow">工作台总览</p>
            <h1 class="dashboard-title page-heading mt-4 text-3xl sm:text-4xl">
              {{ greetingText }}，今天也把每一次投递准备得更稳一点
            </h1>
            <p class="dashboard-copy page-copy mt-4 max-w-2xl text-sm leading-7 sm:text-base">
              这里汇总任务状态、结果产出和最近的执行记录，帮助你快速判断哪些简历已经可继续导出，哪些任务还需要等待或回看。
            </p>

            <div class="dashboard-editorial-note mt-6">
              <span class="dashboard-editorial-note__label">当前节奏</span>
              <p class="dashboard-editorial-note__copy">
                把需要立即处理的任务留在上方，把可沉淀的信息收进下方摘要，这样工作台会更像一个可阅读的编辑台，而不是指标堆叠页。
              </p>
            </div>

            <div class="dashboard-actions mt-6">
              <router-link to="/" class="btn btn-primary min-h-[44px] px-5">
                新建优化任务
              </router-link>
              <button
                type="button"
                class="btn btn-secondary min-h-[44px] px-5"
                :disabled="loading"
                @click="loadDashboard"
              >
                {{ loading ? '正在刷新...' : '刷新数据' }}
              </button>
            </div>
          </div>

          <aside class="dashboard-account p-5 md:p-6">
            <p class="dashboard-account__eyebrow text-xs font-semibold uppercase tracking-[0.24em]">账户概览</p>
            <dl class="mt-4 space-y-4">
              <div class="dashboard-account__row">
                <dt class="dashboard-account__label text-sm">当前套餐</dt>
                <dd class="dashboard-account__value text-sm font-semibold">{{ userStore.tierLabel }}</dd>
              </div>
              <div class="dashboard-account__row">
                <dt class="dashboard-account__label text-sm">可用额度</dt>
                <dd class="dashboard-account__value text-sm font-semibold">{{ userStore.creditsLabel }}</dd>
              </div>
              <div class="dashboard-account__row">
                <dt class="dashboard-account__label text-sm">历史任务</dt>
                <dd class="dashboard-account__value text-sm font-semibold">{{ historyCountText }}</dd>
              </div>
            </dl>
            <p class="dashboard-account__note mt-5 rounded-2xl px-4 py-3 text-sm leading-6">
              顶部切换主题后，这里、任务历史和简历预览会同步变化，方便你在不同阅读场景下查看内容。
            </p>
          </aside>
        </div>
      </section>

      <section v-if="$route.query.adminDenied === '1'" class="surface-panel dashboard-error px-6 py-5" aria-live="polite">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="dashboard-error__title text-base font-semibold">当前账号没有管理员权限</h2>
            <p class="dashboard-error__copy mt-1 text-sm leading-6">
              该入口仅对管理员白名单开放。你仍然可以继续使用普通工作台功能。
            </p>
          </div>
          <router-link to="/" class="btn btn-secondary min-h-[44px] px-5">返回新建任务</router-link>
        </div>
      </section>

      <section aria-labelledby="dashboard-summary-heading">
        <div class="dashboard-section-head">
          <div>
            <p class="dashboard-kicker eyebrow">摘要指标</p>
            <h2 id="dashboard-summary-heading" class="dashboard-section-title mt-2 text-2xl font-bold">最近任务表现</h2>
          </div>
          <p class="dashboard-copy hidden text-sm md:block">继续保持轻量化实现，只用 SVG 与 CSS 呈现趋势。</p>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="metric in summaryCards" :key="metric.key" class="surface-panel dashboard-metric p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="dashboard-metric__label text-xs font-semibold uppercase tracking-[0.18em]">{{ metric.label }}</p>
                <p v-if="loading" class="skeleton-block mt-4 h-9 w-24 rounded"></p>
                <p v-else class="dashboard-metric__value mt-4 text-3xl tracking-tight">{{ metric.value }}</p>
              </div>
              <div class="dashboard-metric__icon-wrap flex h-11 w-11 items-center justify-center rounded-2xl" :style="metric.iconStyle">
                <svg class="h-5 w-5" :style="metric.iconColorStyle" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="metric.iconPath"></path>
                </svg>
              </div>
            </div>
            <p class="dashboard-metric__description mt-4 text-sm leading-6">{{ metric.description }}</p>
          </article>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <CreditChart :chart="dashboard.creditChart" :loading="loading" />
        <ProfileSummary :summary="dashboard.profileSummary" :loading="loading" />
      </section>

      <section
        v-if="errorMessage"
        class="surface-panel dashboard-error px-6 py-5"
        aria-live="assertive"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-start gap-3">
            <div class="dashboard-error__icon mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h2 class="dashboard-error__title text-base font-semibold">工作台数据暂时不可用</h2>
              <p class="dashboard-error__copy mt-1 text-sm leading-6">{{ errorMessage }}</p>
            </div>
          </div>
          <button type="button" class="btn btn-secondary min-h-[44px] px-5" @click="loadDashboard">
            重新加载
          </button>
        </div>
      </section>

      <TaskHistory :items="dashboard.history" :loading="loading" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'
import CreditChart from '../components/CreditChart.vue'
import ProfileSummary from '../components/ProfileSummary.vue'
import TaskHistory from '../components/TaskHistory.vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const loading = ref(true)
const errorMessage = ref('')
const dashboard = reactive({
  summary: {
    totalTasks: 0,
    completedTasks: 0,
    processingTasks: 0,
    failedTasks: 0,
    totalTokens: 0,
    totalLlmCostUsd: 0
  },
  creditChart: {
    title: '额度变化',
    summary: '',
    currentCredits: 0,
    deltaText: '',
    points: []
  },
  profileSummary: {
    title: '候选人画像摘要',
    summary: '',
    completionRate: 0,
    targetRole: '待补充目标岗位',
    strengths: [],
    nextActions: [],
    keywords: []
  },
  history: []
})

const greetingText = computed(() => userStore.displayName || '欢迎回来')
const historyCountText = computed(() => `${dashboard.history.length} 条`)

const summaryCards = computed(() => {
  return [
    {
      key: 'totalTasks',
      label: '累计任务数',
      value: dashboard.summary.totalTasks,
      description: '用于了解你当前账号下已经发起过多少次优化尝试。',
      iconStyle: { background: 'var(--color-primary-light)' },
      iconColorStyle: { color: 'var(--color-primary)' },
      iconPath: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    {
      key: 'completedTasks',
      label: '已完成任务',
      value: dashboard.summary.completedTasks,
      description: '快速确认哪些投递材料已经完成优化并可继续导出使用。',
      iconStyle: { background: 'var(--color-accent-light)' },
      iconColorStyle: { color: 'var(--color-accent)' },
      iconPath: 'M5 13l4 4L19 7'
    },
    {
      key: 'processingTasks',
      label: '处理中任务',
      value: dashboard.summary.processingTasks,
      description: '帮助你判断当前还有多少任务正在运行，便于安排下一步操作。',
      iconStyle: { background: 'color-mix(in srgb, var(--color-warning) 14%, white 86%)' },
      iconColorStyle: { color: 'var(--color-warning)' },
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      key: 'totalTokens',
      label: '累计 Tokens',
      value: dashboard.summary.totalTokens,
      description: `累计估算成本 $${dashboard.summary.totalLlmCostUsd.toFixed(4)}，用于后续扩展模型审计与成本趋势。`,
      iconStyle: { background: 'var(--color-surface-muted)' },
      iconColorStyle: { color: 'var(--color-text-strong)' },
      iconPath: 'M11 17a1 1 0 102 0v-5a1 1 0 10-2 0v5zm-4 0a1 1 0 102 0V7a1 1 0 10-2 0v10zm8 0a1 1 0 102 0v-8a1 1 0 10-2 0v8z'
    }
  ]
})

const applyDashboard = (payload) => {
  dashboard.summary = payload.summary
  dashboard.creditChart = payload.creditChart
  dashboard.profileSummary = payload.profileSummary
  dashboard.history = payload.history
}

const loadDashboard = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const payload = await api.getDashboardSnapshot()
    applyDashboard(payload)
  } catch (error) {
    errorMessage.value = error?.message || '加载工作台数据失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard-shell {
  color: var(--color-text-main);
}

.dashboard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
}

.dashboard-hero::after {
  content: '';
  position: absolute;
  inset: auto -5rem -6rem auto;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-primary-light) 48%, transparent 52%), transparent 70%);
  pointer-events: none;
  opacity: 0.7;
}

.dashboard-editorial-note {
  max-width: 32rem;
  padding-left: 1rem;
  border-left: 1px solid color-mix(in srgb, var(--color-border-strong) 72%, white 28%);
}

.dashboard-editorial-note__label {
  display: inline-block;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.dashboard-editorial-note__copy {
  margin-top: 0.65rem;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
}

.dashboard-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-account {
  border-radius: var(--radius-2xl);
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
  box-shadow: var(--shadow-sm);
}

.dashboard-account__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dashboard-title,
.dashboard-section-title,
.dashboard-account__value,
.dashboard-metric__value {
  color: var(--color-text-strong);
}

.dashboard-title,
.dashboard-section-title,
.dashboard-metric__value {
  font-family: var(--font-display);
  font-weight: 600;
}

.dashboard-copy,
.dashboard-account__label,
.dashboard-account__note,
.dashboard-metric__label,
.dashboard-metric__description,
.dashboard-account__eyebrow {
  color: var(--color-text-muted);
}

.dashboard-account__note {
  background: var(--color-surface-muted);
}

.dashboard-metric__icon-wrap {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-border) 64%, transparent 36%);
}

.dashboard-metric {
  min-height: 100%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 95%, white 5%), color-mix(in srgb, var(--color-surface-muted) 92%, white 8%));
}

.dashboard-metric__value {
  line-height: 1;
}

.dashboard-error {
  border: 1px solid color-mix(in srgb, var(--color-danger) 18%, white 82%);
  background: color-mix(in srgb, var(--color-danger) 8%, white 92%);
}

.dashboard-error__icon {
  background: color-mix(in srgb, var(--color-danger) 14%, white 86%);
  color: var(--color-danger);
}

.dashboard-error__title {
  color: var(--color-danger);
}

.dashboard-error__copy {
  color: color-mix(in srgb, var(--color-danger) 82%, var(--color-text-main) 18%);
}
</style>
