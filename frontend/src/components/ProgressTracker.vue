<template>
  <div class="card tracker-shell p-6 h-full flex flex-col">
    <div class="tracker-head mb-8">
      <h3 class="tracker-title">
        <span class="tracker-status-dot" :class="`tracker-status-dot--${status}`"></span>
        AI 节点执行状态
      </h3>
      <span class="tracker-status-chip">
        {{ status.toUpperCase() }}
      </span>
    </div>

    <div class="tracker-list relative flex-grow">
      <div class="tracker-list__line"></div>

      <div class="space-y-5 relative z-10">
        <div v-for="log in logs" :key="log.node" class="tracker-item">
          <div class="tracker-item__icon" :class="`tracker-item__icon--${log.status}`">
            <svg v-if="log.status === 'pending'" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <svg v-else-if="log.status === 'running'" class="h-[18px] w-[18px] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <svg v-else-if="log.status === 'done'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 13l4 4L19 7"></path></svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>

          <div class="tracker-item__body">
            <div class="tracker-item__meta">
              <h4 class="tracker-item__title" :class="{ 'tracker-item__title--muted': log.status === 'pending' }">{{ log.label }}</h4>
              <span v-if="log.duration" class="tracker-item__duration">{{ log.duration }}ms</span>
            </div>
            <p class="tracker-item__message" :class="{ 'tracker-item__message--muted': log.status === 'pending' }">
              {{ log.message }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="feedbacks.length > 0" class="tracker-feedback mt-8 pt-6">
      <h4 class="tracker-feedback__title">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        审查拦截日志 ({{ feedbacks.length }})
      </h4>
      <div class="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="fb in feedbacks" :key="fb.id" class="tracker-feedback__item animate-fade-in-up">
          <span class="tracker-feedback__time">[{{ fb.time }}]</span>
          <span>{{ fb.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  logs: {
    type: Array,
    required: true
  },
  feedbacks: {
    type: Array,
    default: () => []
  },
  status: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--color-warning) 45%, white 55%); border-radius: 2px; }

.tracker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tracker-title {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-strong);
  font-size: 1.05rem;
  font-weight: 700;
}

.tracker-status-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.tracker-status-dot--processing { background: var(--color-status-processing-text); box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-status-processing-bg) 72%, transparent 28%); }
.tracker-status-dot--completed { background: var(--color-status-success-text); }
.tracker-status-dot--failed { background: var(--color-status-failed-text); }

.tracker-status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.tracker-list__line {
  position: absolute;
  top: 1.1rem;
  left: 1rem;
  bottom: 0.8rem;
  width: 1px;
  background: color-mix(in srgb, var(--color-border) 90%, white 10%);
}

.tracker-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.tracker-item__icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-strong);
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.tracker-item__icon--running {
  border-color: color-mix(in srgb, var(--color-status-processing-text) 28%, white 72%);
  background: var(--color-status-processing-bg);
  color: var(--color-status-processing-text);
}

.tracker-item__icon--done {
  border-color: color-mix(in srgb, var(--color-status-success-text) 24%, white 76%);
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
}

.tracker-item__icon--failed {
  border-color: color-mix(in srgb, var(--color-status-failed-text) 24%, white 76%);
  background: var(--color-status-failed-bg);
  color: var(--color-status-failed-text);
}

.tracker-item__body {
  flex: 1;
  padding-top: 0.1rem;
}

.tracker-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tracker-item__title {
  color: var(--color-text-strong);
  font-size: 0.92rem;
  font-weight: 700;
}

.tracker-item__title--muted,
.tracker-item__message--muted {
  color: color-mix(in srgb, var(--color-text-muted) 75%, white 25%);
}

.tracker-item__duration {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.tracker-item__message {
  margin-top: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  line-height: 1.6;
}

.tracker-feedback {
  border-top: 1px solid color-mix(in srgb, var(--color-border) 88%, white 12%);
}

.tracker-feedback__title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-warning);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.85rem;
}

.tracker-feedback__item {
  display: flex;
  gap: 0.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-warning) 16%, white 84%);
  background: color-mix(in srgb, var(--color-warning) 8%, white 92%);
  color: color-mix(in srgb, var(--color-warning) 72%, var(--color-text-main) 28%);
  padding: 0.8rem 0.9rem;
  font-size: 0.82rem;
}

.tracker-feedback__time {
  color: color-mix(in srgb, var(--color-warning) 56%, white 44%);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  white-space: nowrap;
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
