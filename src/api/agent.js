import request from '@/utils/request'

export const queryAllAgentsInfo = (params) => {
  return request({
    url: '/api/agent/query_agent_info',
    method: 'get',
    params
  })
}

export const queryConversations = (data) => {
  return request({
    url: '/api/agent/query_conversations',
    method: 'post',
    data
  })
}

export const queryMessagesInConversation = (data) => {
  return request({
    url: '/api/agent/query_messages_in_conversation',
    method: 'post',
    data
  })
}

export const deleteConversation = (data) => {
  return request({
    url: '/api/agent/delete_conversation',
    method: 'post',
    data
  })
}

export const chat = (data) => {
  return request({
    url: '/api/agent/chat',
    method: 'post',
    data,
    responseType: 'stream'
  })
}

export const getPresignedUrl = (data) => {
  return request({
    url: '/api/upload/get_presigned_url',
    method: 'post',
    data
  })
}



export const getPackages = () => {
  return request({
    url: '/api/billing/packages',
    method: 'get'
  })
}

export const recharge = (data) => {
  return request({
    url: '/api/billing/recharge',
    method: 'post',
    data
  })
}

export const calculateCustomPrice = (amount) => {
  return request({
    url: '/api/billing/calculate_custom_price',
    method: 'get',
    params: { amount }
  })
}

export const getPaymentStatus = (out_trade_no) => {
  return request({
    url: '/api/payment/get_payment_status',
    method: 'get',
    params: { out_trade_no }
  })
}

export const getAnnouncements = (params = {}) => {
  return request({
    url: '/api/information/announcements',
    method: 'get',
    params: {
      status: 'active',
      ...params
    }
  })
}

export const recommendAgents = (data) => {
  return request({
    url: '/api/information/recommend_agents',
    method: 'post',
    data
  })
}
