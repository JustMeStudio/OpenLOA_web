import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref({
    nick_name: localStorage.getItem('nick_name') || 'Admin',
    avatar_url: '',
    email: '',
    gender: '',
    country: '',
    title: '',
    bio: '',
    experience: 0,
    credit: 0
  })

  const isLoading = ref(false)
  const error = ref('')

  // 从API加载用户信息
  const loadUserInfo = async () => {
    isLoading.value = true
    error.value = ''
    try {
      const res = await getProfile()
      if (res) {
        Object.assign(userInfo.value, res)
        // 同步昵称到localStorage
        if (res.nick_name) {
          localStorage.setItem('nick_name', res.nick_name)
        }
      }
    } catch (err) {
      console.error('Failed to load user info:', err)
      error.value = err.message || 'Failed to load user profile'
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户信息（用于编辑后立即更新store）
  const updateUserInfo = (updates) => {
    Object.assign(userInfo.value, updates)
    // 同步昵称到localStorage
    if (updates.nick_name) {
      localStorage.setItem('nick_name', updates.nick_name)
    }
  }

  // 清除用户信息（登出时调用）
  const clearUserInfo = () => {
    userInfo.value = {
      nick_name: 'Admin',
      avatar_url: '',
      email: '',
      gender: '',
      country: '',
      title: '',
      bio: '',
      experience: 0,
      credit: 0
    }
  }

  return {
    userInfo,
    isLoading,
    error,
    loadUserInfo,
    updateUserInfo,
    clearUserInfo
  }
})
