import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import authApi from '../api/auth'

export const ACCESS_TOKEN_KEY = 'access_token'
export const USER_INFO_KEY = 'user_info'

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || ''

export const getStoredUser = () => {
  const user = safeJsonParse(localStorage.getItem(USER_INFO_KEY), null)
  return user && typeof user === 'object' ? user : null
}

export const persistAuth = (token, user) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }

  if (user && typeof user === 'object') {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
  }
}

export const clearStoredAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}

const normalizeUser = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return {
    id: payload.id ?? payload.user_id ?? payload.uid ?? '',
    username: payload.username ?? payload.name ?? payload.nickname ?? '',
    email: payload.email ?? '',
    tier: payload.tier ?? payload.plan ?? 'free',
    credits: Number(payload.credits ?? payload.credit_balance ?? payload.remaining_credits ?? 0),
    isAdmin: Boolean(payload.is_admin ?? payload.isAdmin ?? false)
  }
}

const pickToken = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  return payload.access_token ?? payload.accessToken ?? payload.token ?? payload.jwt ?? ''
}

const pickUser = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return normalizeUser(payload.user ?? payload.profile ?? payload.data ?? payload)
}

export const useUserStore = defineStore('user', () => {
  const token = ref(getStoredAccessToken())
  const user = ref(getStoredUser())
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))
  const displayName = computed(() => user.value?.username || user.value?.email || '未命名用户')
  const tierLabel = computed(() => {
    const tier = String(user.value?.tier || 'free').toLowerCase()

    if (tier === 'pro') return '专业版'
    if (tier === 'plus') return '高级版'
    if (tier === 'enterprise') return '企业版'
    return '基础版'
  })

  const creditsLabel = computed(() => {
    const credits = Number.isFinite(user.value?.credits) ? user.value.credits : 0
    return `${credits} 点`
  })

  const isAdmin = computed(() => Boolean(user.value?.isAdmin))

  const applyAuthState = (payload) => {
    const nextToken = pickToken(payload)
    const nextUser = pickUser(payload)

    token.value = nextToken || token.value
    user.value = nextUser || user.value
    persistAuth(token.value, user.value)
  }

  const clearAuth = () => {
    token.value = ''
    user.value = null
    clearStoredAuth()
  }

  const fetchCurrentUser = async () => {
    if (!token.value) {
      initialized.value = true
      return null
    }

    loading.value = true

    try {
      // 统一在这里向后端拉最新身份信息，确保积分和套餐展示一致。
      const profile = await authApi.getCurrentUser()
      user.value = normalizeUser(profile)
      persistAuth(token.value, user.value)
      return user.value
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  const login = async (form) => {
    loading.value = true

    try {
      const payload = await authApi.login(form)
      applyAuthState(payload)
      await fetchCurrentUser()
      return user.value
    } finally {
      loading.value = false
    }
  }

  const register = async (form) => {
    loading.value = true

    try {
      const payload = await authApi.register(form)
      applyAuthState(payload)

      if (token.value) {
        await fetchCurrentUser()
      }

      return user.value
    } finally {
      loading.value = false
    }
  }

  const hydrate = () => {
    token.value = getStoredAccessToken()
    user.value = getStoredUser()
    initialized.value = true
  }

  return {
    token,
    user,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    displayName,
    tierLabel,
    creditsLabel,
    hydrate,
    login,
    register,
    fetchCurrentUser,
    clearAuth
  }
})
