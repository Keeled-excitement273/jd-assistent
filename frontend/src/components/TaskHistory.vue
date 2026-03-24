<template>
  <section class="surface-panel task-history p-6 md:p-7" aria-labelledby="task-history-heading">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="task-history__eyebrow text-xs font-semibold uppercase tracking-[0.24em]">任务历史</p>
        <h2 id="task-history-heading" class="task-history__title mt-2 text-xl font-bold">最近提交记录</h2>
      </div>
      <p class="task-history__copy text-sm">保留最近 {{ historyCountLabel }} 条任务状态，便于快速回看。</p>
    </div>

    <div v-if="loading" class="mt-6 space-y-4" aria-live="polite" aria-busy="true">
      <div
        v-for="index in 4"
        :key="index"
        class="task-history__skeleton rounded-2xl p-5"
      >
        <div class="skeleton-block h-4 w-32 rounded"></div>
        <div class="mt-3 skeleton-block h-3 w-48 rounded"></div>
        <div class="mt-4 flex gap-3">
          <div class="skeleton-block h-8 w-20 rounded-full"></div>
          <div class="skeleton-block h-8 w-24 rounded-full"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="items.length === 0"
      class="task-history__empty mt-6 rounded-3xl px-6 py-12 text-center"
    >
      <div class="task-history__empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
        <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6"></path>
        </svg>
      </div>
      <h3 class="task-history__empty-title mt-4 text-lg font-semibold">还没有历史任务</h3>
      <p class="task-history__copy mt-2 text-sm leading-6">
        你提交的优化任务会出现在这里，完成后可以继续回到详情页查看执行过程与导出结果。
      </p>
      <router-link to="/" class="btn btn-primary mt-6 min-h-[44px] px-5">
        去创建第一条任务
      </router-link>
    </div>

    <ol v-else class="mt-6 space-y-4">
      <li v-for="item in items" :key="item.id">
        <article class="task-history__item rounded-3xl p-5 transition-shadow duration-200 hover:shadow-md">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="task-history__item-title truncate text-base font-semibold">{{ item.title }}</h3>
                <span class="status-chip" :class="statusClassMap[item.status] || statusClassMap.unknown">
                  {{ statusTextMap[item.status] || statusTextMap.unknown }}
                </span>
              </div>

              <dl class="task-history__meta mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt class="task-history__meta-label text-xs uppercase tracking-wide">原始文件</dt>
                  <dd class="task-history__meta-value mt-1 text-sm font-medium">{{ item.originalFile || '未记录文件名' }}</dd>
                </div>
                <div>
                  <dt class="task-history__meta-label text-xs uppercase tracking-wide">提交时间</dt>
                  <dd class="task-history__meta-value mt-1 text-sm font-medium">{{ formatDate(item.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="task-history__meta-label text-xs uppercase tracking-wide">完成时间</dt>
                  <dd class="task-history__meta-value mt-1 text-sm font-medium">{{ formatDate(item.updatedAt) }}</dd>
                </div>
                <div>
                  <dt class="task-history__meta-label text-xs uppercase tracking-wide">Token / 成本</dt>
                  <dd class="task-history__meta-value mt-1 text-sm font-medium">
                    {{ formatTokenCost(item.totalTokens, item.llmCostUsd) }}
                  </dd>
                </div>
              </dl>

              <p v-if="item.error" class="task-history__error mt-3 rounded-2xl px-3 py-2 text-sm leading-6">
                {{ item.error }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 lg:justify-end">
              <router-link
                :to="`/task/${item.id}`"
                class="btn btn-secondary min-h-[44px] px-4"
                :aria-label="`查看任务 ${item.title} 的执行详情`"
              >
                查看详情
              </router-link>
              <span
                class="task-history__status-pill inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium"
                :class="item.documentReady ? 'task-history__status-pill--ready' : 'task-history__status-pill--pending'"
              >
                {{ item.documentReady ? '结果可导出' : '等待结果生成' }}
              </span>
            </div>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

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

const historyCountLabel = computed(() => props.items.length || 8)

const formatDate = (value) => {
  if (!value) {
    return '待后端补充'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '时间待校验'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatTokenCost = (tokens, cost) => {
  const normalizedTokens = Number(tokens)
  const normalizedCost = Number(cost)

  const tokenText = Number.isFinite(normalizedTokens) && normalizedTokens > 0
    ? `${normalizedTokens} tokens`
    : '0 tokens'

  const costText = Number.isFinite(normalizedCost) && normalizedCost > 0
    ? `$${normalizedCost.toFixed(4)}`
    : '$0.0000'

  return `${tokenText} / ${costText}`
}
</script>

<style scoped>
.task-history__eyebrow {
  color: var(--color-primary);
}

.task-history__title,
.task-history__item-title,
.task-history__empty-title,
.task-history__meta-value {
  color: var(--color-text-strong);
}

.task-history__title,
.task-history__empty-title {
  font-family: var(--font-display);
  font-weight: 600;
}

.task-history__copy,
.task-history__meta,
.task-history__meta-label {
  color: var(--color-text-muted);
}

.task-history__skeleton,
.task-history__item,
.task-history__empty {
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 94%, white 6%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
}

.task-history__empty {
  border-style: dashed;
}

.task-history__empty-icon {
  background: var(--color-surface-muted);
  color: var(--color-primary);
}

.task-history__error {
  background: color-mix(in srgb, var(--color-danger) 8%, white 92%);
  color: var(--color-danger);
}

.task-history__status-pill--ready {
  border-color: color-mix(in srgb, var(--color-accent) 26%, white 74%);
  background: color-mix(in srgb, var(--color-accent-light) 74%, white 26%);
  color: var(--color-accent);
}

.task-history__status-pill--pending {
  border-color: color-mix(in srgb, var(--color-border-strong) 72%, white 28%);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}
</style>
