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
