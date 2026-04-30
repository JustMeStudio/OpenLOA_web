<template>
  <div class="customer-service-container">
    <!-- 悬浮按钮 -->
    <button 
      v-if="!isOpen" 
      class="service-button"
      @click="handleOpenChat"
      :title="t('common.customerService')"
    >
      <svg class="chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.29 21.82 10.75 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.26-3.96-.74l-.28-.12-2.92.45.45-2.92-.12-.28C4.26 14.73 4 13.41 4 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z" fill="currentColor"/>
      </svg>
      <span class="service-label">{{ t('common.customerService') }}</span>
    </button>

    <!-- 浮窗 -->
    <transition name="slide-up">
      <div v-if="isOpen" class="service-window">
        <!-- 窗口头部 -->
        <div class="window-header">
          <div class="header-title">
            <div class="nami-avatar">Nami</div>
            <div class="header-text">
              <div class="agent-name">{{ agentNickName }}</div>
              <div class="status-text">在线</div>
            </div>
          </div>
          <button class="close-btn" @click="handleCloseChat">✕</button>
        </div>

        <!-- 操作按钮行 -->
        <div class="action-buttons">
          <button class="action-btn" @click="handleNewConversation" :title="t('common.newChat')">
            <span class="btn-icon">🆕</span>
            <span class="btn-text">新对话</span>
          </button>
          <button class="action-btn" @click="handleToggleHistory" :title="t('common.history')">
            <span class="btn-icon">📋</span>
            <span class="btn-text">历史</span>
          </button>
        </div>

        <!-- 历史对话侧边栏 -->
        <transition name="slide-in">
          <div v-if="showHistory" class="history-sidebar">
            <div class="history-header">
              <span class="history-title">对话记录</span>
              <button class="history-close-btn" @click="showHistory = false">✕</button>
            </div>
            <div class="history-list">
              <div v-if="historyLoading" class="loading">加载中...</div>
              <div v-else-if="conversationHistory.length === 0" class="empty">暂无对话</div>
              <div 
                v-for="item in conversationHistory" 
                :key="item.conversation_id"
                class="history-item"
                :class="{ active: currentConversationId === item.conversation_id }"
              >
                <div 
                  class="history-item-content"
                  @click="handleLoadConversation(item.conversation_id)"
                >
                  <div class="history-item-title">
                    {{ item.title || '新对话' }}
                  </div>
                  <div class="history-item-time">
                    {{ formatTime(item.update_time) }}
                  </div>
                </div>
                <button 
                  class="history-item-delete-btn"
                  @click.stop="handleDeleteConversation(item.conversation_id)"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- 聊天区域 -->
        <div class="chat-content">
          <!-- 欢迎界面 -->
          <div v-if="messages.length === 0" class="welcome-section">
            <div class="welcome-avatar">
              <img v-if="agentAvatar" :src="agentAvatar" :alt="agentNickName" class="avatar-image" />
              <div v-else class="avatar-placeholder">Nami</div>
            </div>
            <div class="welcome-title">{{ agentNickName }}</div>
            <div class="welcome-desc">{{ agentDescription }}</div>
            <div class="starter-prompts" v-if="starterPrompts.length > 0">
              <div class="prompts-label">推荐问题：</div>
              <div class="prompts-list">
                <span
                  v-for="(prompt, index) in starterPrompts"
                  :key="index"
                  class="prompt-item"
                  @click="handleStarterPromptClick(prompt)"
                >
                  {{ prompt }}
                </span>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div v-else class="messages-container">
            <div class="messages-list">
              <template v-for="message in messages" :key="message.id">
                <div 
                  v-if="message.type === 'user' || (message.type === 'tool' && message.role === 'user') || message.type === 'image' || (message.content && message.content.trim() !== '')"
                  class="message-item"
                  :class="[message.type, message.role === 'user' ? 'user' : '']"
                >
                  <div class="message-avatar" :class="{ 'has-image': message.role !== 'user' && agentAvatar }">
                    <template v-if="message.type === 'user' || message.role === 'user'">
                      我
                    </template>
                    <template v-else>
                      <img v-if="agentAvatar" :src="agentAvatar" :alt="agentNickName" class="avatar-img" />
                      <span v-else>Nami</span>
                    </template>
                  </div>
                  <div class="message-content">
                    <div v-if="message.type === 'user'" class="message-bubble user">
                      <div>{{ message.content }}</div>
                      <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
                        <div v-for="(file, index) in message.attachments" :key="index" class="attachment-item">
                          📎 {{ file.file_name || file.file_type }}
                        </div>
                      </div>
                    </div>
                    <div v-else-if="message.type === 'tool'" class="tool-message-content">
                      <div class="file-card">
                        <div class="file-card-icon">
                          <span>{{ getFileIcon(message.fileName) }}</span>
                        </div>
                        <div class="file-card-info">
                          <div class="file-card-name">{{ message.fileName || '文件' }}</div>
                          <div class="file-card-hint">{{ message.role === 'user' ? '已发送' : '点击查看' }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="message.type === 'tool-calling'" class="tool-calling-message">
                      <div class="tool-calling-content">
                        <span class="tool-calling-icon">⚙️</span>
                        <span class="tool-calling-text">{{ message.content }}</span>
                        <span class="tool-calling-spinner">
                          <span class="spinner-dot"></span>
                          <span class="spinner-dot"></span>
                          <span class="spinner-dot"></span>
                        </span>
                      </div>
                    </div>
                    <div v-else-if="message.type === 'image'" class="image-message-content">
                      <img :src="message.imageUrl" :alt="'图片'" class="message-image" @load="scrollToBottom" />
                    </div>
                    <div v-else class="ai-message-content">
                      <MarkdownRender :content="message.content" />
                      <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
                        <div v-for="(file, index) in message.attachments" :key="index" class="attachment-item">
                          📎 {{ file.file_name || file.file_type }}
                        </div>
                      </div>
                      <div class="message-time">{{ message.timestamp }}</div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-if="isLoading" class="loading-message">
                <div class="message-avatar" :class="{ 'has-image': agentAvatar }">
                  <img v-if="agentAvatar" :src="agentAvatar" :alt="agentNickName" class="avatar-img" />
                  <span v-else>Nami</span>
                </div>
                <div class="message-content">
                  <div class="ai-message-content">
                    <span class="typing">正在思考中...</span>
                  </div>
                </div>
              </div>
              <div ref="messagesEndRef"></div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <div v-if="selectedFiles.length > 0" class="selected-files-preview">
            <div class="preview-title">附件（{{ selectedFiles.length }}）：</div>
            <div class="files-list">
              <div v-for="file in selectedFiles" :key="file.file_id" class="file-preview-item" :class="{ 'is-image': file.preview }">
                <template v-if="file.preview">
                  <img :src="file.preview" class="image-thumbnail" :alt="file.file_name" />
                </template>
                <template v-else>
                  <span class="file-icon">{{ getFileIcon(file.file_name) }}</span>
                </template>
                <div class="file-info">
                  <span class="file-name">{{ file.file_name }}</span>
                  <span v-if="file.uploading" class="file-status">上传中...</span>
                  <button v-else class="file-remove-btn" @click="handleRemoveFile(file.file_id)">✕</button>
                </div>
              </div>
            </div>
          </div>
          <div class="input-wrapper">
            <textarea 
              v-model="inputMessage"
              placeholder="输入消息...(Shift+Enter换行)"
              @keydown="handleKeyDown"
              @paste="handlePaste"
              class="message-input"
            ></textarea>
            <div class="input-actions">
              <label class="upload-btn">
                📎
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  @change="handleFileUpload"
                  style="display: none;"
                />
              </label>
              <button 
                class="send-btn"
                :disabled="!canSend"
                @click="handleButtonClick"
              >
                {{ buttonText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { MarkdownRender } from 'markstream-vue'
import { refreshToken } from '@/api/auth'
import { queryAllAgentsInfo, getPresignedUrl } from '@/api/agent'
import { isImageFile, compressImage } from '@/utils/imageCompress'

const { t, locale } = useI18n()

// UI状态
const isOpen = ref(false)
const showHistory = ref(false)

// Agent信息
const agentName = ref('Nami')
const agentNickName = ref('Nami')
const agentAvatar = ref('')
const agentDescription = ref('我是你的AI客服，有什么可以帮你的吗？')
const starterPrompts = ref([])

// 消息和对话
const messages = ref([])
const inputMessage = ref('')
const selectedFiles = ref([])
const selectedFileUrls = ref([])
const messagesEndRef = ref(null)
const isLoading = ref(false)
const isGenerating = ref(false)

// 对话历史
const conversationHistory = ref([])
const currentConversationId = ref(null)
const historyLoading = ref(false)

let isRefreshingToken = false
let refreshTokenSubscribers = []

const subscribeRefreshToken = (callback) => {
  refreshTokenSubscribers.push(callback)
}

const onTokenRefreshed = (newToken) => {
  refreshTokenSubscribers.forEach(callback => callback(newToken))
  refreshTokenSubscribers = []
}

const fetchWithTokenRefresh = async (url, options = {}) => {
  const accessToken = localStorage.getItem('access_token')
  const tokenType = localStorage.getItem('token_type') || 'Bearer'
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(accessToken ? { 'Authorization': `${tokenType} ${accessToken}` } : {})
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  if (response.status === 401) {
    const refreshTokenValue = localStorage.getItem('refresh_token')
    
    if (refreshTokenValue && !isRefreshingToken) {
      isRefreshingToken = true
      try {
        const res = await refreshToken({ refresh_token: refreshTokenValue })
        localStorage.setItem('access_token', res.access_token)
        localStorage.setItem('token_type', res.token_type)
        onTokenRefreshed(res.access_token)
        
        const newHeaders = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          'Authorization': `${res.token_type} ${res.access_token}`
        }
        
        return fetch(url, {
          ...options,
          headers: newHeaders
        })
      } catch (err) {
        console.error('Token refresh failed')
        throw err
      } finally {
        isRefreshingToken = false
      }
    }
  }
  
  return response
}

const canSend = computed(() => {
  return (inputMessage.value.trim() || selectedFiles.value.length > 0) && !isGenerating.value
})

const buttonText = computed(() => {
  return isGenerating.value ? '停止' : '发送'
})

const handleOpenChat = () => {
  isOpen.value = true
  showHistory.value = false
  if (conversationHistory.value.length === 0) {
    fetchConversationHistory()
  }
  nextTick(() => scrollToBottom())
}

const handleCloseChat = () => {
  isOpen.value = false
  showHistory.value = false
}

const handleToggleHistory = () => {
  showHistory.value = !showHistory.value
  if (showHistory.value && conversationHistory.value.length === 0) {
    fetchConversationHistory()
  }
}

const handleNewConversation = () => {
  messages.value = []
  currentConversationId.value = null
  selectedFiles.value = []
  selectedFileUrls.value = []
  showHistory.value = false
  inputMessage.value = ''
}

// 根据文件名后缀判断是否为图片（用于历史消息解析，此时没有File对象）
const isImageFileName = (fileName) => {
  if (!fileName) return false
  const ext = fileName.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

const parseNewFormatContent = (msg, baseTimestamp) => {
  const parsedMessages = []
  let messageId = Date.now() + Math.random()
  
  try {
    const contentArray = JSON.parse(msg.content)
    
    if (!Array.isArray(contentArray)) {
      return null
    }
    
    for (const item of contentArray) {
      if (item.type === 'text') {
        try {
          const textValue = JSON.parse(item.text)
          if (textValue && textValue.file_attachment) {
            let fileUrl = textValue.file_attachment
            if (typeof fileUrl === 'string') {
              fileUrl = fileUrl.trim().replace(/`/g, '')
            }
            const fileName = fileUrl.split('/').pop() || '文件'
            if (!isImageFileName(fileName)) {
              parsedMessages.push({
                id: messageId++,
                type: 'tool',
                role: msg.role,
                fileName: fileName,
                fileUrl: fileUrl,
                timestamp: baseTimestamp
              })
            }
          } else {
            // 跳过空文本，避免空气泡
            if (item.text && item.text.trim()) {
              parsedMessages.push({
                id: messageId++,
                type: msg.role === 'user' ? 'user' : 'bot',
                content: item.text,
                timestamp: baseTimestamp
              })
            }
          }
        } catch (parseErr) {
          // 跳过空文本，避免空气泡
          if (item.text && item.text.trim()) {
            parsedMessages.push({
              id: messageId++,
              type: msg.role === 'user' ? 'user' : 'bot',
              content: item.text,
              timestamp: baseTimestamp
            })
          }
        }
      } else if (item.type === 'image_url' && item.image_url && item.image_url.url) {
        parsedMessages.push({
          id: messageId++,
          type: 'image',
          role: msg.role,
          imageUrl: item.image_url.url,
          timestamp: baseTimestamp
        })
      }
    }
    
    return parsedMessages.length > 0 ? parsedMessages : null
  } catch (e) {
    return null
  }
}

const parseSystemPushMessage = (msg, baseTimestamp) => {
  const parsedMessages = []
  let messageId = Date.now() + Math.random()
  
  try {
    const contentData = JSON.parse(msg.content)
    
    if (contentData.role !== 'system_push') {
      return null
    }
    
    if (contentData.content && contentData.content.trim() !== '') {
      parsedMessages.push({
        id: messageId++,
        type: 'bot',
        role: 'system_push',
        content: contentData.content,
        timestamp: baseTimestamp
      })
    }
    
    if (contentData.image_url && contentData.image_url.trim() !== '') {
      parsedMessages.push({
        id: messageId++,
        type: 'image',
        role: 'system_push',
        imageUrl: contentData.image_url,
        timestamp: baseTimestamp
      })
    }
    
    return parsedMessages.length > 0 ? parsedMessages : null
  } catch (e) {
    return null
  }
}

const handleLoadConversation = async (conversationId) => {
  currentConversationId.value = conversationId
  await fetchConversationMessages(conversationId)
  showHistory.value = false
  scrollToBottom()
}

const handleDeleteConversation = async (conversationId) => {
  try {
    await deleteConversation(conversationId)
  } catch (err) {
    console.error('Failed to delete conversation:', err)
  }
}

const fetchConversationHistory = async () => {
  try {
    historyLoading.value = true
    const response = await fetchWithTokenRefresh('/api/agent/query_conversations', {
      method: 'POST',
      body: JSON.stringify({ agent_name: 'Nami' })
    })
    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        conversationHistory.value = data.data
      }
    }
  } catch (err) {
    console.error('Failed to fetch conversation history:', err)
  } finally {
    historyLoading.value = false
  }
}

const fetchConversationMessages = async (conversationId) => {
  try {
    historyLoading.value = true
    const response = await fetchWithTokenRefresh('/api/agent/query_messages_in_conversation', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId })
    })
    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        messages.value = data.data
          .flatMap((msg, index) => {
            const baseTimestamp = msg.create_time ? formatTime(msg.create_time) : formatTime(new Date().toISOString())
            
            // 首先尝试使用system_push格式解析
            if (msg.content) {
              const systemPushMessages = parseSystemPushMessage(msg, baseTimestamp)
              if (systemPushMessages) {
                return systemPushMessages
              }
            }
            
            // 其次尝试使用新格式解析
            if (msg.content) {
              const newFormatMessages = parseNewFormatContent(msg, baseTimestamp)
              if (newFormatMessages) {
                return newFormatMessages
              }
            }
            
            // 回退到旧逻辑
            // role为tool时：仅当content中含file_attachment时作为文件卡片展示，否则跳过
            if (msg.role === 'tool') {
              try {
                const contentData = JSON.parse(msg.content)
                if (contentData.file_attachment) {
                  let fileUrl = contentData.file_attachment
                  if (typeof fileUrl === 'string') {
                    fileUrl = fileUrl.trim().replace(/`/g, '')
                  }
                  const fileName = fileUrl.split('/').pop() || '文件'
                  if (!isImageFileName(fileName)) {
                    return [{ id: index, type: 'tool', role: 'user', fileName, fileUrl, timestamp: baseTimestamp }]
                  }
                }
              } catch (e) { /* ignore */ }
              return []
            }

            if (msg.content && msg.content.trim() !== '') {
              return [{
                id: index,
                type: msg.role === 'user' ? 'user' : 'bot',
                content: msg.content,
                attachments: msg.attachments,
                timestamp: baseTimestamp
              }]
            }
            return []
          })
      }
    }
  } catch (err) {
    console.error('Failed to fetch conversation messages:', err)
  } finally {
    historyLoading.value = false
  }
}

const deleteConversation = async (conversationId) => {
  try {
    const response = await fetchWithTokenRefresh('/api/agent/delete_conversation', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId })
    })
    if (response.ok) {
      ElMessage.success('删除成功')
      await fetchConversationHistory()
      if (currentConversationId.value === conversationId) {
        messages.value = []
        currentConversationId.value = null
      }
    }
  } catch (err) {
    console.error('Failed to delete conversation:', err)
    ElMessage.error('删除失败，请重试')
  }
}

const handleStarterPromptClick = (prompt) => {
  inputMessage.value = prompt
  handleSendMessage()
}

const handleSendMessage = async () => {
  if (!canSend.value) return

  const timestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const messageContent = inputMessage.value
  
  const filesInfo = selectedFiles.value
  const fileAttachments = selectedFileUrls.value
  
  if (messageContent.trim()) {
    messages.value.push({
      id: Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: timestamp
    })
  }
  
  let messageId = Date.now() + Math.random()
  for (const fileInfo of filesInfo) {
    if (fileInfo.static_url) {
      const fileName = fileInfo.file_name
      // 判断是否是图片（优先用File对象，降级用文件名后缀）
      if (isImageFile(fileInfo.file) || isImageFileName(fileName)) {
        // 图片消息
        messages.value.push({
          id: messageId++,
          type: 'image',
          role: 'user',
          imageUrl: fileInfo.static_url,
          timestamp: timestamp
        })
      } else {
        // 文件消息
        messages.value.push({
          id: messageId++,
          type: 'tool',
          role: 'user',
          fileName: fileName,
          fileUrl: fileInfo.static_url,
          timestamp: timestamp
        })
      }
    }
  }
  
  inputMessage.value = ''
  selectedFiles.value = []
  selectedFileUrls.value = []
  isLoading.value = true
  isGenerating.value = true
  scrollToBottom()

  try {
    const requestData = {
      agent_name: 'Nami',
      content: messageContent
    }

    if (currentConversationId.value) {
      requestData.conversation_id = currentConversationId.value
    }

    if (fileAttachments.length > 0) {
      requestData.file_attachments = fileAttachments
    }

    const response = await fetchWithTokenRefresh('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let newConversationId = null
    let assistantMessageId = Date.now() + 1
    let shouldUpdateCurrentMessage = true
    let hasShownToolCalling = false

    const botMessage = {
      id: assistantMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    messages.value.push(botMessage)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6)
          if (dataStr === '[DONE]') continue

          try {
            const data = JSON.parse(dataStr)
            
            if (data.conversation_id) {
              newConversationId = data.conversation_id
              currentConversationId.value = newConversationId
              fetchConversationHistory()
            }

            // assistant消息中含tool_calls：显示“正在使用工具”框
            if (data.role === 'assistant' && data.tool_calls && data.tool_calls.length > 0 && !hasShownToolCalling) {
              hasShownToolCalling = true
              messages.value = messages.value.filter(msg => !msg.isToolCalling)
              messages.value = [...messages.value, {
                id: 'tool-calling-' + Date.now(),
                type: 'tool-calling',
                isToolCalling: true,
                content: '正在使用工具中，请稍候...',
                timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }]
              shouldUpdateCurrentMessage = false
              scrollToBottom()
            }

            // tool角色消息：移除工具调用框，不展示结果给用户
            if (data.role === 'tool') {
              messages.value = messages.value.filter(msg => !msg.isToolCalling)
              shouldUpdateCurrentMessage = false
              continue
            }

            if (data.content !== undefined) {
              if (!shouldUpdateCurrentMessage) {
                assistantMessageId = Date.now() + 3
                fullContent = data.content
                messages.value = [...messages.value, {
                  id: assistantMessageId,
                  type: 'bot',
                  content: fullContent,
                  timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }]
                shouldUpdateCurrentMessage = true
              } else {
                fullContent += data.content
                if (isLoading.value) isLoading.value = false
                messages.value = messages.value.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                )
              }
              scrollToBottom()
            } else if (data.message !== undefined) {
              if (!shouldUpdateCurrentMessage) {
                assistantMessageId = Date.now() + 3
                fullContent = data.message
                messages.value = [...messages.value, {
                  id: assistantMessageId,
                  type: 'bot',
                  content: fullContent,
                  timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }]
                shouldUpdateCurrentMessage = true
              } else {
                fullContent += data.message
                if (isLoading.value) isLoading.value = false
                messages.value = messages.value.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
                )
              }
              scrollToBottom()
            }
          } catch (e) {
            console.error('Failed to parse response:', e)
          }
        }
      }
    }

    messages.value = messages.value.filter(msg => (msg.type === 'tool' && msg.role === 'user') || msg.type === 'image' || (msg.content && msg.content.trim() !== ''))

    if (!newConversationId) {
      await fetchConversationHistory()
    }
    scrollToBottom()

  } catch (err) {
    console.error('Failed to send message:', err)
    ElMessage.error('发送消息失败，请重试')
  } finally {
    isLoading.value = false
    isGenerating.value = false
  }
}

const handleButtonClick = () => {
  if (isGenerating.value) {
    isGenerating.value = false
  } else {
    handleSendMessage()
  }
}

const handlePaste = (e) => {
  const items = e.clipboardData?.items
  if (!items) return

  const files = []
  for (let item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        // 为粘贴的文件重命名，添加时间戳确保唯一性
        let fileName = file.name
        const ext = fileName.split('.').pop()
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
        
        // 如果是默认的图片名称或缺少有意义的名字，添加时间戳
        if (nameWithoutExt.toLowerCase() === 'image' || nameWithoutExt.toLowerCase() === 'untitled') {
          fileName = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
        }
        
        // 创建新的 File 对象，带有重命名的名称
        const renamedFile = new File([file], fileName, { type: file.type })
        files.push(renamedFile)
      }
    }
  }

  if (files.length > 0) {
    e.preventDefault()
    // 将粘贴的文件转换成 FileList 样式的对象，然后调用现有的上传逻辑
    const event = {
      target: {
        files: files
      }
    }
    handleFileUpload(event)
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files)
  
  // 创建生成图片预览的函数
  const generateImagePreview = (file) => {
    return new Promise((resolve) => {
      if (!isImageFile(file)) {
        resolve(null)
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        resolve(event.target.result)
      }
      reader.onerror = () => {
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }
  
  for (let file of files) {
    let fileInfo = null
    try {
      if (isImageFile(file)) {
        try {
          file = await compressImage(file)
        } catch (error) {
          console.error('Image compression failed:', error)
          ElMessage.warning('图片压缩失败，将使用原文件上传')
        }
      }
      
      fileInfo = {
        file_name: file.name,
        file_type: file.name.split('.').pop(),
        file_id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        uploading: true,
        preview: null
      }
      
      // 为图片生成预览
      if (isImageFile(file)) {
        fileInfo.preview = await generateImagePreview(file)
      }
      
      selectedFiles.value.push(fileInfo)

      const presignedRes = await getPresignedUrl({ 
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || 'application/octet-stream'
      })
      
      if (presignedRes.status === 'success' && presignedRes.data) {
        const { upload_url, oss_key, access_key_id, policy, signature, static_url } = presignedRes.data
        
        const formData = new FormData()
        formData.append('key', oss_key)
        formData.append('policy', policy)
        formData.append('OSSAccessKeyId', access_key_id)
        formData.append('signature', signature)
        formData.append('Content-Type', file.type || 'application/octet-stream')
        formData.append('file', file)
        
        const uploadResponse = await fetch(upload_url, {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error(`OSS upload failed: ${uploadResponse.status}`)
        }

        selectedFileUrls.value.push(static_url)
        
        const index = selectedFiles.value.findIndex(f => f.file_id === fileInfo.file_id)
        if (index !== -1) {
          selectedFiles.value[index].uploading = false
          selectedFiles.value[index].static_url = static_url
        }
      }
    } catch (error) {
      console.error('File upload failed:', error)
      if (fileInfo) {
        const index = selectedFiles.value.findIndex(f => f.file_id === fileInfo.file_id)
        if (index !== -1) {
          selectedFiles.value.splice(index, 1)
        }
      }
    }
  }
  
  e.target.value = ''
}

const handleRemoveFile = (fileId) => {
  const index = selectedFiles.value.findIndex(f => f.file_id === fileId)
  if (index !== -1) {
    const removedFile = selectedFiles.value[index]
    selectedFiles.value.splice(index, 1)
    
    const urlIndex = selectedFileUrls.value.findIndex(url => 
      removedFile.static_url && url === removedFile.static_url
    )
    if (urlIndex !== -1) {
      selectedFileUrls.value.splice(urlIndex, 1)
    }
  }
}

const getFileIcon = (fileName) => {
  if (!fileName) return '📄'
  const ext = fileName.split('.').pop().toLowerCase()
  const iconMap = {
    // 图片
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️', 'bmp': '🖼️',
    // PDF
    'pdf': '📕',
    // 文档
    'doc': '📄', 'docx': '📄', 'txt': '📝', 'md': '📝', 'rst': '📝',
    // 表格
    'xls': '📊', 'xlsx': '📊', 'csv': '📊',
    // 代码
    'js': '⚙️', 'ts': '⚙️', 'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️', 'h': '⚙️', 'go': '🐹', 'rs': '🦀', 'rb': '💎', 'php': '🐘', 'html': '🌐', 'css': '🎨', 'json': '⚙️', 'sql': '🗄️',
    // 其他
    'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️', 'tar': '🗜️',
    'mp3': '🎵', 'mp4': '🎬', 'avi': '🎬', 'mov': '🎬'
  }
  return iconMap[ext] || '📁'
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').split('.')[0]
}

const scrollToBottom = () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

const getLanguageCode = (localeValue) => {
  return localeValue === 'zh-CN' ? 'zh' : 'en'
}

// 初始化时加载agent信息
watch(() => isOpen.value, async (newVal) => {
  if (newVal && !agentAvatar.value) {
    try {
      const lang = getLanguageCode(locale.value)
      const res = await queryAllAgentsInfo({ agent_name: 'Nami', language: lang })
      if (res && res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const agentData = res.data[0]
        agentNickName.value = agentData.nick_name || 'Nami'
        agentAvatar.value = agentData.avatar || ''
        agentDescription.value = agentData.description || '我是你的AI客服，有什么可以帮你的吗？'
        starterPrompts.value = agentData.starter_prompts || []
      }
    } catch (error) {
      console.error('Failed to fetch agent info:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.customer-service-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  z-index: 999;
}

.service-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: white;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }

  .chat-icon {
    width: 28px;
    height: 28px;
  }

  .service-label {
    display: none;
  }
}

.service-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e8e9eb;

  @media (max-width: 480px) {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
    height: 70vh;
  }
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border-bottom: 1px solid #e8e9eb;
  flex-shrink: 0;

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;

    .nami-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .header-text {
      .agent-name {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }

      .status-text {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #999;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      color: #333;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #e8e9eb;
  flex-shrink: 0;

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e8e9eb;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #666;
    transition: all 0.2s;

    &:hover {
      background: #f5f7ff;
      border-color: #6366f1;
      color: #6366f1;
    }

    .btn-icon {
      font-size: 14px;
    }

    .btn-text {
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .btn-text {
        display: none;
      }
    }
  }
}

.history-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  z-index: 10;
  animation: slideInFromLeft 0.3s ease;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border-bottom: 1px solid #e8e9eb;
  flex-shrink: 0;

  .history-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  .history-close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #999;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      color: #333;
    }
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  .loading,
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #999;
    font-size: 14px;
  }

  .history-item {
    padding: 12px 14px;
    margin-bottom: 8px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    &:hover {
      background: #f5f7ff;
      border-color: #e0e7ff;
    }

    &.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-color: #6366f1;

      .history-item-title,
      .history-item-time,
      .history-item-content {
        color: white;
      }

      .history-item-delete-btn {
        opacity: 1;
      }
    }

    .history-item-content {
      flex: 1;
      min-width: 0;
      color: #333;

      &:hover {
        color: inherit;
      }
    }

    .history-item-title {
      font-size: 13px;
      color: #333;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .history-item-time {
      font-size: 11px;
      color: #999;
    }

    .history-item-delete-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      border-radius: 6px;
      flex-shrink: 0;
      opacity: 0;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(255, 77, 79, 0.1);
        opacity: 1;
      }

      &.active {
        opacity: 1;
      }
    }

    &:hover .history-item-delete-btn {
      opacity: 1;
    }
  }
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;

  .welcome-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 24px;
    font-weight: 600;
    overflow: hidden;

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 24px;
    }
  }

  .welcome-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .welcome-desc {
    font-size: 14px;
    color: #666;
    text-align: center;
  }

  .starter-prompts {
    padding: 8px 16px 4px;
    .prompts-label {
      font-size: 12px;
      color: #999;
      margin-bottom: 8px;
      text-align: center;
    }
    .prompts-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      .prompt-item {
        padding: 6px 12px;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 16px;
        font-size: 12px;
        color: #409eff;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          background: #f0f7ff;
          border-color: #409eff;
        }
      }
    }
  }
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: white;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 8px;
  animation: fadeIn 0.3s ease;

  &.user {
    justify-content: flex-end;

    .message-avatar {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .message-content {
      max-width: 70%;

      .message-bubble {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }
    }
  }

  &:not(.user) {
    .message-avatar {
      background: #f0f0f0;
      color: #666;
    }

    .message-content {
      max-width: 85%;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.message-content {
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 10px 12px;
  border-radius: 12px;
  word-break: break-word;
  white-space: pre-wrap;
  background: #f0f0f0;
  color: #333;

  &.user {
    border-bottom-right-radius: 4px;
  }
}

.image-message-content,
.ai-message-content {
  padding: 10px;
  border-radius: 12px;
  background: white;

  .message-image {
    max-width: 100%;
    border-radius: 8px;
  }

  .message-time {
    font-size: 11px;
    color: #999;
    margin-top: 6px;
  }
}

.tool-message-content {
  padding: 8px;
  border-radius: 12px;
  background: white;
  display: flex;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border: 1px solid #e8e9eb;
  border-radius: 10px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
    border-color: #d9dce2;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.1);
  }

  .file-card-icon {
    font-size: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .file-card-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .file-card-name {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-card-hint {
      font-size: 11px;
      color: #999;
    }
  }
}

.attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .attachment-item {
    font-size: 12px;
    padding: 6px 10px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 6px;
    color: #666;
  }
}

.typing {
  color: #999;
  font-style: italic;
}

.loading-message {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.input-section {
  padding: 12px;
  background: #fafbfc;
  border-top: 1px solid #e8e9eb;
  flex-shrink: 0;
}

.selected-files-preview {
  margin-bottom: 12px;

  .preview-title {
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .file-preview-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: white;
    border: 1px solid #e8e9eb;
    border-radius: 8px;
    font-size: 12px;

    .file-icon {
      font-size: 14px;
    }

    .file-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #666;
    }

    .file-status {
      color: #999;
      font-size: 11px;
      flex-shrink: 0;
    }

    .file-remove-btn {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 3px;
      color: #999;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
      flex-shrink: 0;
      padding: 0;

      &:hover {
        background: #f5f5f5;
        color: #ff6b6b;
      }
    }

    &.is-image {
      flex-direction: column;
      align-items: flex-start;
      padding: 8px;
      gap: 6px;
    }

    .image-thumbnail {
      width: 100%;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e8e9eb;
      flex-shrink: 0;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;

      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #666;
        font-size: 11px;
      }

      .file-status {
        color: #999;
        font-size: 10px;
        flex-shrink: 0;
      }

      .file-remove-btn {
        width: 16px;
        height: 16px;
        padding: 0;
        flex-shrink: 0;
      }
    }
  }
}

.input-wrapper {
  display: flex;
  gap: 8px;
  background: white;
  border: 1px solid #e8e9eb;
  border-radius: 10px;
  padding: 8px;
  align-items: flex-end;

  .message-input {
    flex: 1;
    border: none;
    outline: none;
    resize: vertical;
    max-height: 80px;
    min-height: 36px;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.4;
    padding: 4px 8px;
    color: #333;

    &::placeholder {
      color: #999;
    }
  }

  .input-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;

    .upload-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #f0f0f0;
      }
    }

    .send-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      cursor: pointer;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.tool-calling-message {
  min-width: 0;
  width: 100%;

  .tool-calling-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
    border: 1.5px solid #fecaca;
    border-radius: 10px;
    font-size: 13px;
    color: #92400e;
    animation: slideIn 0.3s ease-out;

    .tool-calling-icon {
      font-size: 16px;
      flex-shrink: 0;
      animation: spin 2s linear infinite;
    }

    .tool-calling-text {
      flex: 1;
      font-weight: 500;
    }

    .tool-calling-spinner {
      display: flex;
      gap: 3px;
      align-items: center;
      flex-shrink: 0;

      .spinner-dot {
        width: 5px;
        height: 5px;
        background: #fca5a5;
        border-radius: 50%;
        animation: bounce 1.4s infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40%            { transform: scale(1);   opacity: 1; }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s ease;
}

.slide-in-enter-from {
  transform: translateX(100%);
}

.slide-in-leave-to {
  transform: translateX(100%);
}
</style>
