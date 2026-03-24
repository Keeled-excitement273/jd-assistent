import { apiClient } from './index'

const unwrapResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return response
  }

  return response.data ?? response
}

export default {
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload)
    return unwrapResponse(response.data)
  },

  async login(payload) {
    const response = await apiClient.post('/auth/login', payload)
    return unwrapResponse(response.data)
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me')
    return unwrapResponse(response.data)
  }
}
