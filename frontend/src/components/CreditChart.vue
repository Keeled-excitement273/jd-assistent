<template>
  <section class="surface-panel credit-chart p-6 md:p-7" aria-labelledby="credit-chart-heading">
    <div class="credit-chart__header">
      <div>
        <p class="credit-chart__eyebrow">额度趋势</p>
        <h2 id="credit-chart-heading" class="credit-chart__title">{{ chart.title }}</h2>
        <p class="credit-chart__summary">{{ chart.summary }}</p>
      </div>

      <div class="credit-chart__stat">
        <span class="credit-chart__stat-label">当前可用额度</span>
        <strong v-if="!loading" class="credit-chart__stat-value">{{ chart.currentCredits }} 点</strong>
        <span v-else class="skeleton-block credit-chart__stat-skeleton"></span>
        <span v-if="!loading" class="credit-chart__delta">{{ chart.deltaText }}</span>
      </div>
    </div>

    <div v-if="loading" class="credit-chart__loading" aria-live="polite" aria-busy="true">
      <div class="skeleton-block h-56 rounded-[1.5rem]"></div>
      <div class="grid grid-cols-4 gap-3">
        <div v-for="index in 4" :key="index" class="skeleton-block h-4 rounded"></div>
      </div>
    </div>

    <div v-else-if="!hasPoints" class="credit-chart__empty">
      <div class="credit-chart__empty-icon" aria-hidden="true">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 19h16M7 16l3-3 3 2 5-6"></path>
        </svg>
      </div>
      <div>
        <h3 class="credit-chart__empty-title">最近 7 天还没有可展示的额度记录</h3>
        <p class="credit-chart__empty-copy">当账户在最近 7 天产生真实额度流水后，这里会按天展示每日余额与当日额度变动。</p>
      </div>
    </div>

    <div v-else class="credit-chart__body">
      <svg
        class="credit-chart__svg"
        viewBox="0 0 640 240"
        role="img"
          :aria-label="`${chart.title}，当前可用额度 ${chart.currentCredits} 点`"
        preserveAspectRatio="none"
      >
        <line
          v-for="(lineY, index) in gridLines"
          :key="`grid-${index}`"
          x1="44"
          :y1="lineY"
          x2="604"
          :y2="lineY"
          class="credit-chart__grid"
        />
        <path :d="areaPath" class="credit-chart__area"></path>
        <path :d="linePath" class="credit-chart__line"></path>
        <circle
          v-for="point in plottedPoints"
          :key="point.id"
          :cx="point.x"
          :cy="point.y"
          r="5"
          class="credit-chart__point"
        />
      </svg>

      <ol class="credit-chart__labels">
        <li v-for="point in plottedPoints" :key="`${point.id}-label`" class="credit-chart__label-item">
          <span class="credit-chart__label-name">{{ point.shortLabel }}</span>
           <strong class="credit-chart__label-value">{{ point.value }} 点</strong>
           <span v-if="point.hint" class="credit-chart__label-hint">{{ point.hint }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  chart: {
    type: Object,
    default: () => ({
      title: '额度变化',
      summary: '',
      currentCredits: 0,
      deltaText: '',
      points: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const hasPoints = computed(() => Array.isArray(props.chart?.points) && props.chart.points.length > 0)

const chartValues = computed(() => hasPoints.value ? props.chart.points.map((point) => Number(point.value) || 0) : [0])

const maxValue = computed(() => Math.max(...chartValues.value, 1))
const minValue = computed(() => Math.min(...chartValues.value, 0))
const valueRange = computed(() => Math.max(maxValue.value - minValue.value, 1))

const plottedPoints = computed(() => {
  if (!hasPoints.value) {
    return []
  }

  const width = 560
  const height = 156
  const offsetX = 44
  const offsetY = 28
  const step = props.chart.points.length > 1 ? width / (props.chart.points.length - 1) : width / 2

  return props.chart.points.map((point, index) => {
    const normalizedValue = (Number(point.value) || 0) - minValue.value
    const x = offsetX + (props.chart.points.length > 1 ? step * index : width / 2)
    const y = offsetY + height - (normalizedValue / valueRange.value) * height

    return {
      ...point,
      x,
      y
    }
  })
})

const linePath = computed(() => {
  if (!plottedPoints.value.length) {
    return ''
  }

  return plottedPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (!plottedPoints.value.length) {
    return ''
  }

  const firstPoint = plottedPoints.value[0]
  const lastPoint = plottedPoints.value.at(-1)

  return `${linePath.value} L ${lastPoint.x} 184 L ${firstPoint.x} 184 Z`
})

const gridLines = computed(() => [28, 80, 132, 184])
</script>

<style scoped>
.credit-chart__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.credit-chart__eyebrow {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.credit-chart__title {
  margin-top: 0.4rem;
  font-size: 1.4rem;
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--color-text-strong);
}

.credit-chart__summary {
  margin-top: 0.65rem;
  max-width: 38rem;
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.credit-chart__stat {
  min-width: 10rem;
  padding: 1rem 1.1rem;
  border: 1px solid color-mix(in srgb, var(--color-border) 82%, white 18%);
  border-radius: 1.25rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 92%, white 8%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
}

.credit-chart__stat-label,
.credit-chart__delta {
  display: block;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.credit-chart__stat-value {
  display: block;
  margin-top: 0.45rem;
  font-size: 1.85rem;
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-text-strong);
}

.credit-chart__delta {
  margin-top: 0.5rem;
}

.credit-chart__stat-skeleton {
  display: block;
  width: 6rem;
  height: 2rem;
  margin-top: 0.5rem;
  border-radius: 0.8rem;
}

.credit-chart__loading,
.credit-chart__body {
  margin-top: 1.5rem;
}

.credit-chart__loading {
  display: grid;
  gap: 1rem;
}

.credit-chart__empty {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.4rem;
  border-radius: 1.5rem;
  background: var(--color-surface-muted);
  color: var(--color-text-main);
}

.credit-chart__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  border-radius: 1rem;
  background: var(--color-bg-card);
  color: var(--color-primary);
}

.credit-chart__empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-strong);
}

.credit-chart__empty-copy {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.credit-chart__svg {
  width: 100%;
  height: 15rem;
}

.credit-chart__grid {
  stroke: var(--color-chart-grid);
  stroke-width: 1;
}

.credit-chart__area {
  fill: var(--color-chart-fill);
}

.credit-chart__line {
  fill: none;
  stroke: var(--color-chart-line);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.credit-chart__point {
  fill: var(--color-bg-card);
  stroke: var(--color-chart-line);
  stroke-width: 3;
}

.credit-chart__labels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--color-border) 72%, white 28%);
}

.credit-chart__label-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.credit-chart__label-name,
.credit-chart__label-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.credit-chart__label-value {
  font-size: 0.95rem;
  color: var(--color-text-strong);
}

@media (max-width: 767px) {
  .credit-chart__empty {
    align-items: flex-start;
  }
}
</style>
