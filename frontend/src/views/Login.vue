<template>
  <div class="container mx-auto px-4">
    <div class="login-shell max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section class="surface-panel login-info px-7 py-8 md:px-10 md:py-10">
        <p class="eyebrow">账号接入</p>
        <h1 class="page-heading mt-4 text-3xl sm:text-4xl">
          登录后继续使用你的智能简历优化工作台
        </h1>
        <p class="page-copy mt-4 text-sm leading-7 sm:text-base">
          登录后即可提交优化任务、查看执行进度、使用 SSE 实时回传，并在生成完成后导出 Word 文档。
        </p>

        <ul class="login-points mt-8">
          <li class="login-point">
            <span class="login-point__dot"></span>
            <span>统一保存账户、套餐和剩余额度信息</span>
          </li>
          <li class="login-point">
            <span class="login-point__dot"></span>
            <span>受保护的任务流和导出能力，仅对已登录用户开放</span>
          </li>
          <li class="login-point">
            <span class="login-point__dot"></span>
            <span>鉴权失效会自动退出，避免任务执行中断后状态混乱</span>
          </li>
        </ul>

        <div class="login-aside-note mt-8">
          <span class="login-aside-note__label">进入之后</span>
          <p class="login-aside-note__copy">
            你会在同一个界面里完成任务创建、执行回看、结果校对和导出，不需要在多个分散页面之间切换。
          </p>
        </div>
      </section>

      <section class="card login-card p-7 md:p-9">
        <div class="login-card__top">
          <div>
            <p class="eyebrow">身份验证</p>
            <h2 class="page-heading mt-3 text-2xl">{{ isRegisterMode ? '创建账号' : '欢迎回来' }}</h2>
            <p class="page-copy mt-2 text-sm">
              {{ isRegisterMode ? '注册后即可开始提交新的优化任务。' : '登录后继续查看任务进度与导出结果。' }}
            </p>
          </div>

          <div class="login-mode-switch" role="tablist" aria-label="登录注册切换">
            <button
              type="button"
              class="login-mode-switch__button"
              :class="{ 'login-mode-switch__button--active': !isRegisterMode }"
              :aria-selected="!isRegisterMode"
              @click="switchMode(false)"
            >
              登录
            </button>
            <button
              type="button"
              class="login-mode-switch__button"
              :class="{ 'login-mode-switch__button--active': isRegisterMode }"
              :aria-selected="isRegisterMode"
              @click="switchMode(true)"
            >
              注册
            </button>
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="form-group !mb-0">
            <label for="email" class="form-label">邮箱</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              class="form-control"
              placeholder="name@example.com"
              autocomplete="email"
              :disabled="submitting"
              required
            >
          </div>

          <div class="form-group !mb-0">
            <label for="password" class="form-label">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-control"
              :placeholder="isRegisterMode ? '至少输入 8 位密码' : '请输入密码'"
              autocomplete="current-password"
              :disabled="submitting"
              required
              minlength="8"
            >
          </div>

          <p v-if="errorMessage" class="login-error" role="alert">
            {{ errorMessage }}
          </p>

          <button type="submit" class="btn btn-primary w-full justify-center py-3 text-base" :disabled="submitting || !canSubmit">
            <span v-if="submitting">{{ isRegisterMode ? '正在创建账号...' : '正在登录...' }}</span>
            <span v-else>{{ isRegisterMode ? '注册并进入系统' : '登录并继续' }}</span>
          </button>
        </form>

        <p class="login-toggle mt-6 text-sm">
          {{ isRegisterMode ? '已经有账号了？' : '还没有账号？' }}
          <button type="button" class="login-toggle__button" @click="switchMode(!isRegisterMode)">
            {{ isRegisterMode ? '直接登录' : '立即注册' }}
          </button>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isRegisterMode = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  email: '',
  password: ''
})

const redirectTarget = computed(() => {
  return typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/'
})

const canSubmit = computed(() => {
  const hasEmail = form.email.trim().length > 0
  const hasPassword = form.password.trim().length >= 8

  return hasEmail && hasPassword
})

const resetFeedback = () => {
  errorMessage.value = ''
}

const switchMode = (nextMode) => {
  isRegisterMode.value = nextMode
  resetFeedback()
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    errorMessage.value = isRegisterMode.value ? '请把注册信息填写完整。' : '请输入邮箱和密码后再继续。'
    return
  }

  submitting.value = true
  resetFeedback()

  try {
    if (isRegisterMode.value) {
      await userStore.register({
        email: form.email.trim(),
        password: form.password
      })

      if (!userStore.isAuthenticated) {
        await userStore.login({
          email: form.email.trim(),
          password: form.password
        })
      }
    } else {
      await userStore.login({
        email: form.email.trim(),
        password: form.password
      })
    }

    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error?.response?.data?.detail || error?.message || (isRegisterMode.value ? '注册失败，请稍后再试。' : '登录失败，请检查邮箱和密码。')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.login-shell {
  align-items: stretch;
}

.login-points {
  display: grid;
  gap: 1rem;
}

.login-point {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  color: var(--color-text-main);
  line-height: 1.7;
}

.login-point__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 9999px;
  margin-top: 0.55rem;
  background: var(--color-primary);
  flex-shrink: 0;
}

.login-aside-note {
  max-width: 30rem;
  padding-left: 1rem;
  border-left: 1px solid color-mix(in srgb, var(--color-border-strong) 72%, white 28%);
}

.login-aside-note__label {
  display: inline-block;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-aside-note__copy {
  margin-top: 0.65rem;
  color: var(--color-text-muted);
  font-size: 0.92rem;
  line-height: 1.8;
}

.login-card {
  border-color: color-mix(in srgb, var(--color-border) 88%, white 12%);
  background: linear-gradient(180deg, color-mix(in srgb, var(--color-bg-card) 95%, white 5%), color-mix(in srgb, var(--color-surface-muted) 90%, white 10%));
}

.login-card__top {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.login-mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem;
  border-radius: 9999px;
  background: var(--color-surface-muted);
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, white 20%);
}

.login-mode-switch__button {
  min-height: 2.5rem;
  padding: 0.55rem 1rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.login-mode-switch__button--active {
  background: var(--color-surface-strong);
  color: var(--color-text-strong);
  box-shadow: var(--shadow-sm);
}

.login-error {
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--color-danger) 18%, white 82%);
  background: color-mix(in srgb, var(--color-danger) 8%, white 92%);
  color: color-mix(in srgb, var(--color-danger) 82%, var(--color-text-main) 18%);
  padding: 0.95rem 1rem;
  font-size: 0.9rem;
}

.login-toggle {
  color: var(--color-text-muted);
}

.login-toggle__button {
  color: var(--color-primary);
  font-weight: 600;
}

@media (min-width: 768px) {
  .login-card__top {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}
</style>
