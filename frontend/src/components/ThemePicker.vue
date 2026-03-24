<template>
  <section class="theme-picker" aria-labelledby="theme-picker-heading">
    <div class="theme-picker__meta">
      <label id="theme-picker-heading" class="theme-picker__label" for="theme-picker-select">界面主题</label>
      <p class="theme-picker__summary">当前：{{ themeStore.currentTheme.label }}</p>
    </div>

    <div class="theme-picker__control">
      <span class="theme-picker__swatches" aria-hidden="true">
        <span
          v-for="color in themeStore.currentTheme.preview"
          :key="color"
          class="theme-picker__swatch theme-ring"
          :style="{ background: color }"
        ></span>
      </span>

      <select
        id="theme-picker-select"
        v-model="selectedThemeId"
        class="theme-picker__select"
        aria-describedby="theme-picker-current-theme"
      >
        <option
          v-for="theme in themeStore.themes"
          :key="theme.id"
          :value="theme.id"
        >
          {{ theme.label }}
        </option>
      </select>

      <span class="theme-picker__chevron" aria-hidden="true"></span>
    </div>

    <span id="theme-picker-current-theme" class="sr-only">当前主题：{{ themeStore.currentTheme.label }}</span>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const selectedThemeId = computed({
  get: () => themeStore.activeThemeId,
  set: (themeId) => themeStore.setTheme(themeId)
})
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.theme-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent 10%);
}

.theme-picker__meta {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
  flex: 1 1 auto;
}

.theme-picker__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.theme-picker__summary {
  font-size: 0.76rem;
  line-height: 1.35;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-picker__control {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 0 0 10.5rem;
}

.theme-picker__swatches {
  position: absolute;
  left: 0.75rem;
  display: inline-flex;
  align-items: center;
  pointer-events: none;
  z-index: 1;
}

.theme-picker__swatch {
  width: 0.82rem;
  height: 0.82rem;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.85);
}

.theme-picker__swatch + .theme-picker__swatch {
  margin-left: -0.2rem;
}

.theme-picker__select {
  appearance: none;
  width: 100%;
  min-height: 2.45rem;
  padding: 0.55rem 2.1rem 0.55rem 3.35rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: var(--color-surface-strong);
  color: var(--color-text-strong);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.theme-picker__select:hover {
  border-color: var(--color-border-strong);
}

.theme-picker__select:focus,
.theme-picker__select:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.theme-picker__chevron {
  position: absolute;
  right: 0.9rem;
  width: 0.6rem;
  height: 0.6rem;
  border-right: 1.5px solid var(--color-text-muted);
  border-bottom: 1.5px solid var(--color-text-muted);
  transform: translateY(-25%) rotate(45deg);
  pointer-events: none;
}

@media (max-width: 767px) {
  .theme-picker {
    padding: 0.45rem 0.5rem;
  }

  .theme-picker__control {
    flex-basis: 9.75rem;
  }
}

@media (max-width: 560px) {
  .theme-picker {
    flex-wrap: wrap;
    border-radius: 1rem;
  }

  .theme-picker__meta,
  .theme-picker__control {
    flex-basis: 100%;
  }
}
</style>
