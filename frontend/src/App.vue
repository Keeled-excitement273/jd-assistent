<template>
  <div class="app-shell min-h-screen flex flex-col">
    <header class="app-header print:hidden">
      <div class="container mx-auto px-4 py-4">
        <div class="app-header__inner">
          <div class="app-header__brand">
            <p class="eyebrow">JD Assistent</p>
            <h1 class="app-brand mt-3">Editorial Resume Workshop</h1>
            <p class="app-copy mt-3 text-sm">
              统一提交优化任务、回看执行过程，并在完成后导出正式文档。
            </p>
          </div>

          <div class="app-header__actions">
            <div class="app-theme-picker-wrap">
              <ThemePicker />
            </div>

            <div class="app-header__meta">
              <nav class="app-nav">
                <template v-if="userStore.isAuthenticated">
                  <router-link v-if="userStore.isAdmin" to="/admin" custom v-slot="{ href, navigate, isActive }">
                    <a
                      :href="href"
                      class="app-nav-link"
                      :class="{ 'app-nav-link-active': isActive }"
                      @click="navigate"
                    >
                      管理后台
                    </a>
                  </router-link>
                  <router-link to="/dashboard" custom v-slot="{ href, navigate, isActive }">
                    <a
                      :href="href"
                      class="app-nav-link"
                      :class="{ 'app-nav-link-active': isActive }"
                      @click="navigate"
                    >
                      工作台
                    </a>
                  </router-link>
                  <router-link to="/" custom v-slot="{ href, navigate, isActive }">
                    <a
                      :href="href"
                      class="app-nav-link"
                      :class="{ 'app-nav-link-active': isActive }"
                      @click="navigate"
                    >
                      新建任务
                    </a>
                  </router-link>
                </template>
              </nav>

              <div v-if="userStore.isAuthenticated" class="app-header__account">
                <span class="app-pill app-pill-primary inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                  {{ userStore.displayName }}
                </span>
                <span class="app-pill app-pill-accent inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                  {{ userStore.tierLabel }}
                </span>
                <span class="app-pill app-pill-muted inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                  剩余额度 {{ userStore.creditsLabel }}
                </span>
                <button type="button" class="btn btn-secondary !px-4 text-xs" @click="handleLogout">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main relative flex-1">
      <router-view></router-view>
    </main>

    <footer class="app-footer text-center py-6 text-sm mt-auto print:hidden">
      <p>&copy; 2026 JD Assistent. Calm workflow for tailored resume writing.</p>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ThemePicker from './components/ThemePicker.vue'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user'

const router = useRouter()
const themeStore = useThemeStore()
const userStore = useUserStore()

const handleLogout = async () => {
  userStore.clearAuth()
  await router.replace('/login')
}

onMounted(async () => {
  themeStore.hydrate()
  userStore.hydrate()

  if (userStore.isAuthenticated) {
    try {
      await userStore.fetchCurrentUser()
    } catch {
      // 鉴权失效会由请求拦截器统一处理，这里保持安静避免重复提示。
    }
  }
})
</script>

<style>
.app-shell {
  background: var(--color-page-gradient);
  color: var(--color-text-main);
  transition: background 0.28s ease, color 0.28s ease;
}

.app-header {
  padding-top: 1.25rem;
  padding-bottom: 0.9rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-overlay) 74%, transparent 26%), transparent 100%);
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
}

.app-header__inner {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.app-header__brand,
.app-header__actions,
.app-header__meta {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.app-brand {
  color: var(--color-text-strong);
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2vw, 1.8rem);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}

.app-copy,
.app-note {
  color: var(--color-text-muted);
  max-width: 36rem;
  line-height: 1.75;
}

.app-theme-picker-wrap {
  width: 100%;
  max-width: 19rem;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-surface-elevated) 92%, transparent 8%);
  border: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
}

.app-nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border-radius: 9999px;
  padding: 0.625rem 0.95rem;
  color: var(--color-text-muted);
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.app-nav-link:hover {
  background-color: var(--color-surface-muted);
  color: var(--color-text-strong);
}

.app-nav-link-active {
  background-color: color-mix(in srgb, var(--color-primary-light) 42%, white 58%);
  color: var(--color-text-strong);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent 82%);
}

.app-header__account {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.app-pill {
  min-height: 2rem;
  border: 1px solid transparent;
}

.app-pill-primary {
  background: color-mix(in srgb, var(--color-primary-light) 62%, white 38%);
  border-color: color-mix(in srgb, var(--color-primary) 14%, white 86%);
  color: var(--color-text-strong);
}

.app-pill-accent {
  background: color-mix(in srgb, var(--color-accent-light) 72%, white 28%);
  border-color: color-mix(in srgb, var(--color-accent) 14%, white 86%);
  color: var(--color-accent);
}

.app-pill-muted {
  background: var(--color-surface-muted);
  border-color: color-mix(in srgb, var(--color-border) 80%, white 20%);
  color: var(--color-text-muted);
}

.app-main {
  padding-top: 1.35rem;
  padding-bottom: 3.5rem;
}

.app-footer {
  color: var(--color-text-muted);
  border-top: 1px solid color-mix(in srgb, var(--color-border) 84%, white 16%);
  background: color-mix(in srgb, var(--color-bg-card) 90%, transparent 10%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .app-header__inner {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .app-header__actions,
  .app-header__meta {
    align-items: flex-end;
  }

  .app-header__brand {
    max-width: 35rem;
  }
}

@media (max-width: 767px) {
  .app-theme-picker-wrap {
    max-width: none;
  }
}
</style>
