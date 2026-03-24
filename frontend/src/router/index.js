import { createRouter, createWebHistory } from 'vue-router'
import { getStoredAccessToken, getStoredUser } from '../stores/user'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import TaskProcess from '../views/TaskProcess.vue'
import Dashboard from '../views/Dashboard.vue'
import Admin from '../views/Admin.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      guestOnly: true
    }
  },
  {
    path: '/task/:id',
    name: 'TaskProcess',
    component: TaskProcess,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isAuthenticated = Boolean(getStoredAccessToken())
  const currentUser = getStoredUser()
  const isAdmin = Boolean(currentUser?.isAdmin)

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return '/'
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    return {
      path: '/dashboard',
      query: {
        adminDenied: '1'
      }
    }
  }

  return true
})

export default router
