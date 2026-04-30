import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { refreshToken } from '@/api/auth'

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb)
}

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

const request = axios.create({
  baseURL: '',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token')
    const tokenType = localStorage.getItem('token_type') || 'Bearer'
    if (accessToken) {
      config.headers.Authorization = `${tokenType} ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401) {
      if (originalRequest.url === '/api/account/login') {
        return Promise.reject(error)
      }
      
      if (originalRequest.url === '/api/security/refresh_token') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token_type')
        ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            router.push('/')
          }
        })
        return Promise.reject(error)
      }

      if (!isRefreshing) {
        isRefreshing = true
        const refreshTokenValue = localStorage.getItem('refresh_token')
        
        if (refreshTokenValue) {
          try {
            const res = await refreshToken({ refresh_token: refreshTokenValue })
            localStorage.setItem('access_token', res.access_token)
            localStorage.setItem('token_type', res.token_type)
            onTokenRefreshed(res.access_token)
            originalRequest.headers.Authorization = `${res.token_type} ${res.access_token}`
            return request(originalRequest)
          } catch (refreshError) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_type')
            ElMessageBox.alert('登录已过期，请重新登录', '提示', {
              confirmButtonText: '确定',
              callback: () => {
                router.push('/')
              }
            })
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('token_type')
          ElMessageBox.alert('请先登录', '提示', {
            confirmButtonText: '确定',
            callback: () => {
              router.push('/')
            }
          })
          return Promise.reject(error)
        }
      } else {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            const tokenType = localStorage.getItem('token_type') || 'Bearer'
            originalRequest.headers.Authorization = `${tokenType} ${token}`
            resolve(request(originalRequest))
          })
        })
      }
    }

    const authUrls = ['/api/account/login', '/api/account/register', '/api/account/send_code']
    
    if (!authUrls.includes(originalRequest.url)) {
      let errorMessage = '网络错误'
      if (error.response?.status) {
        // 优先使用后端返回的详细错误信息
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else {
          switch (error.response.status) {
            case 400:
              errorMessage = '参数错误、验证码错误或密码不匹配'
              break
            case 403:
              errorMessage = '账号被禁用或权限不足'
              break
            case 409:
              errorMessage = '邮箱或手机号已被注册'
              break
            case 500:
              errorMessage = '服务器内部错误'
              break
            default:
              errorMessage = `请求失败 (${error.response.status})`
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      ElMessage.error(errorMessage)
    }
    return Promise.reject(error)
  }
)

export default request
