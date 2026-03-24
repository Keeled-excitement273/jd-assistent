<template>
  <section class="surface-panel profile-summary p-6 md:p-7" aria-labelledby="profile-summary-heading">
    <div class="profile-summary__header">
      <div>
        <p class="profile-summary__eyebrow">画像摘要</p>
        <h2 id="profile-summary-heading" class="profile-summary__title">{{ summary.title }}</h2>
      </div>
      <div class="profile-summary__score">
        <span class="profile-summary__score-label">画像就绪度</span>
        <strong v-if="!loading" class="profile-summary__score-value">{{ summary.completionRate }}%</strong>
        <span v-else class="skeleton-block profile-summary__score-skeleton"></span>
      </div>
    </div>

    <div v-if="loading" class="profile-summary__loading" aria-live="polite" aria-busy="true">
      <div class="skeleton-block h-4 w-32 rounded"></div>
      <div class="skeleton-block h-20 rounded-2xl"></div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="skeleton-block h-24 rounded-2xl"></div>
        <div class="skeleton-block h-24 rounded-2xl"></div>
      </div>
    </div>

    <div v-else class="profile-summary__body">
      <div class="profile-summary__progress" aria-hidden="true">
        <span class="profile-summary__progress-track">
          <span class="profile-summary__progress-fill" :style="{ width: `${summary.completionRate}%` }"></span>
        </span>
        <span class="profile-summary__progress-text">画像资产：{{ summary.targetRole }}</span>
      </div>

      <p class="profile-summary__overview">{{ summary.summary }}</p>

      <div class="profile-summary__grid">
        <article class="profile-summary__card">
          <h3 class="profile-summary__card-title">当前优势</h3>
          <ul v-if="summary.strengths.length" class="profile-summary__list">
            <li v-for="item in summary.strengths" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="profile-summary__empty-copy">当前还没有可复用的技能簇标签。</p>
        </article>

        <article class="profile-summary__card">
          <h3 class="profile-summary__card-title">下一步建议</h3>
          <ul v-if="summary.nextActions.length" class="profile-summary__list">
            <li v-for="item in summary.nextActions" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="profile-summary__empty-copy">当前没有额外建议，继续提交任务即可积累画像样本。</p>
        </article>
      </div>

      <div v-if="summary.keywords.length" class="profile-summary__keywords">
        <span v-for="keyword in summary.keywords" :key="keyword" class="profile-summary__keyword">{{ keyword }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  summary: {
    type: Object,
    default: () => ({
      title: '候选人画像摘要',
      summary: '',
      completionRate: 0,
      targetRole: '等待首次画像落库',
      strengths: [],
      nextActions: [],
      keywords: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.profile-summary__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.profile-summary__eyebrow {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.profile-summary__title {
  margin-top: 0.4rem;
  font-size: 1.4rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-text-strong);
}

.profile-summary__score {
  min-width: 7rem;
  padding: 0.95rem 1rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, white 18%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
}

.profile-summary__score-label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.profile-summary__score-value {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.8rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-text-strong);
}

.profile-summary__score-skeleton {
  display: block;
  width: 4.4rem;
  height: 2rem;
  margin-top: 0.35rem;
  border-radius: 0.8rem;
}

.profile-summary__loading,
.profile-summary__body {
  display: grid;
  gap: 1rem;
  margin-top: 1.4rem;
}

.profile-summary__progress {
  display: grid;
  gap: 0.55rem;
}

.profile-summary__progress-track {
  position: relative;
  height: 0.75rem;
  overflow: hidden;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-border) 70%, white 30%);
}

.profile-summary__progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 62%, var(--color-accent) 38%));
}

.profile-summary__progress-text,
.profile-summary__overview,
.profile-summary__empty-copy {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.profile-summary__grid {
  display: grid;
  gap: 1rem;
}

.profile-summary__card {
  padding: 1rem 1.1rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: color-mix(in srgb, var(--color-bg-card) 90%, white 10%);
}

.profile-summary__card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-strong);
}

.profile-summary__list {
  margin-top: 0.7rem;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.45rem;
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--color-text-main);
}

.profile-summary__keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.profile-summary__keyword {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.38rem 0.8rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-primary-light) 58%, white 42%);
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
}

@media (min-width: 768px) {
  .profile-summary__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
