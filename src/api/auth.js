import request from '@/utils/request'

export const sendCode = (params) => {
  return request({
    url: '/api/account/send_code',
    method: 'post',
    params
  })
}

export const login = (data) => {
  return request({
    url: '/api/account/login',
    method: 'post',
    data
  })
}

export const register = (data) => {
  return request({
    url: '/api/account/register',
    method: 'post',
    data
  })
}

export const refreshToken = (data) => {
  return request({
    url: '/api/security/refresh_token',
    method: 'post',
    data
  })
}

export const updateUserInfo = (data) => {
  return request({
    url: '/api/account/update_user_info',
    method: 'post',
    data
  })
}

export const getProfile = () => {
  return request({
    url: '/api/account/profile',
    method: 'get'
  })
}

export const getPresignedUrl = (data) => {
  return request({
    url: '/api/upload/get_presigned_url',
    method: 'post',
    data
  })
}

export const resetPassword = (data) => {
  return request({
    url: '/api/account/reset_password',
    method: 'post',
    data
  })
}
