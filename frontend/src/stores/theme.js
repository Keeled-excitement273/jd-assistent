import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultTheme, themeMap, themes } from '../themes'

export const APP_THEME_KEY = 'app_theme'

const getStoredThemeId = () => localStorage.getItem(APP_THEME_KEY) || defaultTheme.id

const persistThemeId = (themeId) => {
  localStorage.setItem(APP_THEME_KEY, themeId)
}

const resolveTheme = (themeId) => themeMap[themeId] || defaultTheme

const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.setAttribute('data-theme', theme.id)
  root.style.colorScheme = theme.colorScheme || 'light'

  Object.entries(theme.tokens).forEach(([token, value]) => {
    root.style.setProperty(token, value)
  })
}

export const useThemeStore = defineStore('theme', () => {
  const activeThemeId = ref(defaultTheme.id)

  const currentTheme = computed(() => resolveTheme(activeThemeId.value))

  const setTheme = (themeId) => {
    const nextTheme = resolveTheme(themeId)
    activeThemeId.value = nextTheme.id
    persistThemeId(nextTheme.id)
    applyThemeToDocument(nextTheme)
  }

  const hydrate = () => {
    setTheme(getStoredThemeId())
  }

  return {
    themes,
    activeThemeId,
    currentTheme,
    hydrate,
    setTheme
  }
})
