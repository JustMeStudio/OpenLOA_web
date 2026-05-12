<template>
  <div class="agent-work-page">
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="goHome">
          <div class="logo-container">
            <img src="/logo.png" alt="OpenLOA" class="logo-image" />
          </div>
        </div>
        <div class="auth-buttons">
          <template v-if="!isLoggedIn">
            <el-button type="primary" @click="handleGoLogin">登录</el-button>
          </template>
          <template v-else>
            <div class="user-info-wrapper">
              <span class="user-name">{{ userName }}</span>
              <el-button type="default" @click="handleLogout">退出登录</el-button>
            </div>
          </template>
        </div>
      </div>
    </header>

    <main class="main-content">
      <aside class="sidebar">
        <button 
          class="new-chat-btn"
          @click="handleNewConversation"
        >
          <span>➕</span>
          <span>开启新对话</span>
        </button>

        <div class="conversation-list">
          <div v-if="loading && conversationHistory.length === 0" class="loading">
            加载中...
          </div>

          <div v-else-if="!loading && conversationHistory.length === 0" class="empty">
            暂无对话历史
          </div>

          <div 
            v-for="item in conversationHistory" 
            :key="item.conversation_id"
            class="conversation-item"
            :class="{ active: currentConversationId === item.conversation_id }"
            @click="handleLoadConversation(item.conversation_id)"
          >
            <div class="conversation-info">
              <div class="conversation-title">
                {{ item.title || '新对话' }}
              </div>
              <div class="conversation-time">
                {{ formatTime(item.update_time) }}
              </div>
            </div>
            <button 
              class="menu-btn"
              @click.stop="handleMenuClick($event, item.conversation_id)"
            >
              ⋯
            </button>
          </div>

          <div 
            v-if="menuState.visible" 
            class="context-menu"
            :style="{ left: menuState.position.x + 'px', top: menuState.position.y + 'px' }"
            @click.stop
          >
            <button @click="handleDeleteConversation(menuState.conversationId)">
              🗑️ 删除
            </button>
          </div>
        </div>
      </aside>

      <section class="chat-area">
        <div class="chat-split-container">
          <div class="chat-left">
            <div v-if="messages.length === 0" class="welcome">
              <!-- Welcome Card Header -->
              <div class="welcome-card-header">
                <div class="welcome-header-content">
                  <div class="welcome-avatar">
                    <img :src="agentAvatar" alt="avatar" class="avatar-image" v-if="agentAvatar" />
                    <div class="avatar-placeholder" v-else>🤖</div>
                  </div>
                  <div class="welcome-info">
                    <div class="welcome-title">{{ agentNickName }}</div>
                    <div class="welcome-desc">{{ agentDescription }}</div>
                  </div>
                </div>

              </div>

              <!-- Suggested Questions Grid -->
              <div class="prompts-section" v-if="starterPrompts.length > 0">
                <div class="prompts-header">推荐问题</div>
                <div class="prompts-grid">
                  <div 
                    v-for="(prompt, index) in starterPrompts" 
                    :key="index" 
                    class="prompt-card"
                    @click="handleStarterPromptClick(prompt)"
                  >
                    <div class="prompt-icon">{{ getPromptEmoji(index) }}</div>
                    <div class="prompt-text">{{ prompt }}</div>
                  </div>
                </div>
              </div>

              <div class="input-section">
                <div v-if="selectedFiles.length > 0" class="selected-files-preview">
                  <div class="preview-title">待发送附件（{{ selectedFiles.length }}）：</div>
                  <div class="files-list">
                    <div 
                      v-for="file in selectedFiles" 
                      :key="file.file_id"
                      class="file-preview-item"
                      :class="{ 'is-image': file.preview }"
                    >
                      <template v-if="file.preview">
                        <img :src="file.preview" class="image-thumbnail" :alt="file.file_name" />
                      </template>
                      <template v-else>
                        <span class="file-icon">{{ getFileIcon(file.file_name || file.file_type) }}</span>
                      </template>
                      <div class="file-info">
                        <span class="file-name">{{ file.file_name }}</span>
                        <span v-if="file.uploading" class="file-status">上传中...</span>
                        <button 
                          v-else
                          class="file-remove-btn"
                          @click="handleRemoveFile(file.file_id)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="input-wrapper">
                  <textarea 
                    v-model="inputMessage"
                    placeholder="输入你的问题或指令...(Shift+Enter换行)"
                    @keydown="handleKeyDown"
                    @paste="handlePaste"
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
                      :disabled="!isGenerating && !inputMessage.trim() && selectedFiles.length === 0"
                      @click="handleButtonClick"
                    >
                      {{ buttonText }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="chat-messages">
              <div class="messages-list" ref="messagesListRef">
                <template 
                  v-for="message in messages" 
                  :key="message.id"
                >
                  <div 
                    v-if="message.type === 'user' || message.type === 'tool' || message.type === 'image' || message.type === 'chart' || message.type === 'sql_result' || (message.content && message.content.trim() !== '')"
                    class="message-item"
                    :class="[message.type, message.role === 'user' ? 'user' : '']"
                  >
                    <div 
                      class="message-avatar"
                      :class="{ 'has-image': message.role !== 'user' && agentAvatar }"
                    >
                      <template v-if="message.type === 'user' || message.role === 'user'">
                        {{ '我' }}
                      </template>
                      <template v-else>
                        <img v-if="agentAvatar" :src="agentAvatar" :alt="agentName" class="avatar-img" />
                        <span v-else>🤖</span>
                      </template>
                    </div>
                    <div class="message-content">
                      <div 
                        v-if="message.type === 'user'"
                        class="message-bubble user"
                      >
                        <pre class="message-text">{{ message.content }}</pre>
                        <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
                          <div 
                            v-for="(file, index) in message.attachments" 
                            :key="index"
                            class="attachment-item"
                          >
                            📎 {{ file.file_name || file.file_type }}
                          </div>
                        </div>
                      </div>
                      <div 
                        v-else-if="message.type === 'tool'"
                        class="tool-message-content"
                      >
                        <button
                          class="file-card"
                          type="button"
                          @click="handleToolFileClick(message)"
                        >
                          <div class="file-card-accent"></div>
                          <div class="file-card-icon-shell">
                            <div class="file-card-icon">
                              <span>{{ getFileIcon(message.fileName) }}</span>
                            </div>
                            <span class="file-card-ext">{{ getFileType(message.fileName || 'file').toUpperCase() }}</span>
                          </div>
                          <div class="file-card-info">
                            <div class="file-card-eyebrow">文件附件</div>
                            <div class="file-card-name">{{ message.fileName || '文件' }}</div>
                            <div class="file-card-hint">点击后在新标签页打开</div>
                          </div>
                          <div class="file-card-action">
                            <span class="action-label">Open</span>
                            <span class="action-icon">↗</span>
                          </div>
                        </button>
                      </div>
                      <div 
                        v-else-if="message.type === 'image'"
                        class="image-message-content"
                      >
                        <img 
                          :src="message.imageUrl" 
                          :alt="'图片'"
                          class="message-image"
                          @load="scrollToBottom"
                        />
                      </div>
                      <div 
                        v-else-if="message.type === 'chart'"
                        class="chart-message-content"
                      >
                        <div class="chart-card">
                          <div class="chart-card-header">
                            <div>
                              <div class="chart-card-title">{{ message.title }}</div>
                              <div class="chart-card-subtitle">{{ getChartTypeLabel(message.chartType) }}</div>
                            </div>
                            <span class="chart-card-badge">图表</span>
                          </div>
                          <div class="chart-canvas-wrapper">
                            <canvas :ref="(element) => setChartCanvasRef(message.id, element)"></canvas>
                          </div>
                          <div class="message-time">
                            {{ message.timestamp }}
                          </div>
                        </div>
                      </div>
                      <div 
                        v-else-if="message.type === 'sql_result'"
                        class="sql-result-message-content"
                      >
                        <div class="sql-result-card">
                          <div class="sql-result-header">
                            <div class="sql-result-title">
                              <span class="sql-result-icon">📊</span>
                              <span>SQL 查询结果</span>
                            </div>
                            <span v-if="message.result === 'success'" class="sql-result-badge success">成功</span>
                            <span v-else class="sql-result-badge error">失败</span>
                          </div>
                          
                          <div v-if="message.result === 'success'" class="sql-result-body">
                            <div class="sql-timing-info">
                              <div class="timing-item">
                                <span class="timing-label">SQL 生成耗时</span>
                                <span class="timing-value">{{ message.sql_generate_time_ms }}ms</span>
                              </div>
                              <div class="timing-item">
                                <span class="timing-label">执行耗时</span>
                                <span class="timing-value">{{ message.sql_execute_time_ms }}ms</span>
                              </div>
                            </div>
                            
                            <div class="sql-query-section">
                              <div class="sql-query-title">生成的 SQL</div>
                              <div class="sql-query-code">{{ message.sql }}</div>
                            </div>
                            
                            <div v-if="message.data && message.data.length > 0" class="sql-results-section">
                              <div class="results-title">查询结果 ({{ message.data.length }} 行)</div>
                              <div class="sql-results-table">
                                <table>
                                  <thead>
                                    <tr>
                                      <th v-for="(key) in getSqlResultKeys(message.data[0])" :key="key">
                                        {{ key }}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-for="(row, index) in message.data" :key="index">
                                      <td v-for="(key) in getSqlResultKeys(message.data[0])" :key="key">
                                        {{ formatSqlCellValue(row[key]) }}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            
                            <div v-else class="sql-empty-result">
                              暂无查询结果
                            </div>
                          </div>
                          
                          <div v-else class="sql-result-error">
                            <div class="error-message">{{ message.error || '查询失败' }}</div>
                            <div v-if="message.sql" class="error-sql">
                              <div class="error-sql-title">执行的 SQL</div>
                              <div class="error-sql-code">{{ message.sql }}</div>
                            </div>
                          </div>
                          
                          <div class="message-time">
                            {{ message.timestamp }}
                          </div>
                        </div>
                      </div>
                      <div 
                        v-else-if="message.type === 'tool-calling'"
                        class="tool-calling-message"
                      >
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
                      <div 
                        v-else-if="message.systemType === 'tool_confirmation'"
                        class="tool-confirmation-message"
                      >
                        <div class="tool-confirmation-content">
                          <div class="confirmation-text">
                            <MarkdownRender :content="message.content" :show-tooltips="false" />
                          </div>
                          <div class="confirmation-buttons">
                            <button 
                              class="confirmation-btn allow-btn"
                              @click="handleConfirmToolExecution(true, message.id)"
                            >
                              ✓ 允许
                            </button>
                            <button 
                              class="confirmation-btn deny-btn"
                              @click="handleConfirmToolExecution(false, message.id)"
                            >
                              ✕ 拒绝
                            </button>
                          </div>
                        </div>
                      </div>
                      <div 
                        v-else
                        class="ai-message-content"
                      >
                        <MarkdownRender :content="message.content" :show-tooltips="false" />
                        <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
                          <div 
                            v-for="(file, index) in message.attachments" 
                            :key="index"
                            class="attachment-item"
                          >
                            📎 {{ file.file_name || file.file_type }}
                          </div>
                        </div>
                        <div class="message-time">
                          {{ message.timestamp }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-if="isLoading" class="loading-message">
                  <div class="message-avatar" :class="{ 'has-image': agentAvatar }">
                    <img v-if="agentAvatar" :src="agentAvatar" :alt="agentName" class="avatar-img" />
                    <span v-else>🤖</span>
                  </div>
                  <div class="message-content">
                    <div class="ai-message-content">
                      <span class="typing">正在思考中...</span>
                    </div>
                  </div>
                </div>
                <div ref="messagesEndRef"></div>
              </div>

              <div class="input-area">
                <div v-if="selectedFiles.length > 0" class="selected-files-preview">
                  <div class="preview-title">待发送附件（{{ selectedFiles.length }}）：</div>
                  <div class="files-list">
                    <div 
                      v-for="file in selectedFiles" 
                      :key="file.file_id"
                      class="file-preview-item"
                      :class="{ 'is-image': file.preview }"
                    >
                      <template v-if="file.preview">
                        <img :src="file.preview" class="image-thumbnail" :alt="file.file_name" />
                      </template>
                      <template v-else>
                        <span class="file-icon">{{ getFileIcon(file.file_name || file.file_type) }}</span>
                      </template>
                      <div class="file-info">
                        <span class="file-name">{{ file.file_name }}</span>
                        <span v-if="file.uploading" class="file-status">上传中...</span>
                        <button 
                          v-else
                          class="file-remove-btn"
                          @click="handleRemoveFile(file.file_id)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="input-wrapper">
                  <textarea 
                    v-model="inputMessage"
                    placeholder="输入你的问题或指令...(Shift+Enter换行)"
                    @keydown="handleKeyDown"
                    @paste="handlePaste"
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
                      :disabled="!isGenerating && !inputMessage.trim() && selectedFiles.length === 0"
                      @click="handleButtonClick"
                    >
                      {{ buttonText }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </section>
    </main>

    <el-dialog
      v-model="confirmDialogVisible"
      title="确认删除"
      width="400px"
      :close-on-click-modal="false"
    >
      <p>确定要删除该对话吗？删除后无法恢复。</p>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleConfirmDelete">删除</el-button>
      </template>
    </el-dialog>




  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MarkdownRender } from 'markstream-vue'
import Chart from 'chart.js/auto'
import { Workbook } from 'exceljs'
import { refreshToken, getProfile } from '@/api/auth'
import { queryAllAgentsInfo, getPresignedUrl } from '@/api/agent'
import { isImageFile, compressImage } from '@/utils/imageCompress'

const route = useRoute()
const router = useRouter()

const agentName = ref('')
const agentNickName = ref('')
const agentAvatar = ref('')
const agentDescription = ref('')
const starterPrompts = ref([])
const userAvatar = ref('')
const userName = computed(() => localStorage.getItem('nick_name') || '用户')
const isLoggedIn = computed(() => !!localStorage.getItem('access_token'))

const messages = ref([])
const inputMessage = ref('')
const selectedFiles = ref([])
const selectedFileUrls = ref([])
const messagesEndRef = ref(null)
const messagesListRef = ref(null)
const selectedResultFile = ref(null)
const isGenerating = ref(false)  // 用于标记是否正在生成
const chatAbortController = ref(null)  // 用于中断stream请求

const chartCanvasRefs = new Map()
const chartInstances = new Map()
const supportedChartTypes = new Set(['bar', 'line', 'pie'])
const chartPalette = ['#4f46e5', '#0f766e', '#ea580c', '#0891b2', '#dc2626', '#7c3aed', '#ca8a04', '#2563eb']

const getChartTypeLabel = (chartType) => {
  const labelMap = {
    bar: '柱状图',
    line: '折线图',
    pie: '饼图'
  }

  return labelMap[chartType] || '图表'
}

const getSqlResultKeys = (row) => {
  if (!row || typeof row !== 'object') return []
  return Object.keys(row)
}

const formatSqlCellValue = (value) => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const hexToRgba = (hex, alpha) => {
  const normalizedHex = hex.replace('#', '')
  const value = normalizedHex.length === 3
    ? normalizedHex.split('').map(char => char + char).join('')
    : normalizedHex

  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const getChartColors = (count) => {
  return Array.from({ length: count }, (_, index) => chartPalette[index % chartPalette.length])
}

const normalizeChartData = (chartType, title, rawData = {}) => {
  const labels = Array.isArray(rawData.labels) ? rawData.labels : []

  if (chartType === 'pie') {
    const values = Array.isArray(rawData.values)
      ? rawData.values
      : Array.isArray(rawData.datasets?.[0]?.data)
        ? rawData.datasets[0].data
        : []
    const colors = getChartColors(values.length)

    return {
      labels,
      datasets: [{
        label: title || '数据',
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8
      }]
    }
  }

  const datasets = Array.isArray(rawData.datasets) ? rawData.datasets : []

  return {
    labels,
    datasets: datasets.map((dataset, index) => {
      const color = chartPalette[index % chartPalette.length]

      return {
        ...dataset,
        borderColor: dataset.borderColor || color,
        backgroundColor: dataset.backgroundColor || (chartType === 'line' ? hexToRgba(color, 0.12) : hexToRgba(color, 0.82)),
        pointBackgroundColor: dataset.pointBackgroundColor || color,
        pointBorderColor: dataset.pointBorderColor || '#ffffff',
        pointRadius: chartType === 'line' ? 3 : undefined,
        tension: chartType === 'line' ? 0.32 : undefined,
        fill: chartType === 'line' ? false : dataset.fill
      }
    })
  }
}

const createChartMessage = (payload, timestamp, role = 'system_push') => {
  if (!payload) {
    return null
  }
  
  // 支持两种格式：
  // 1. 旧的流式格式：{ action: 'render_chart', chart_type: ..., data: ... }
  // 2. 新的 file_attachments 格式：{ type: 'chart', chart_type: ..., data: ... }
  if (payload.action !== 'render_chart' && payload.type !== 'chart') {
    return null
  }

  const chartType = payload.chart_type
  const chartData = payload.data

  if (!supportedChartTypes.has(chartType) || !chartData || !Array.isArray(chartData.labels)) {
    console.warn('收到无法渲染的图表消息:', payload)
    return null
  }

  if (chartType === 'pie') {
    const pieValues = Array.isArray(chartData.values)
      ? chartData.values
      : chartData.datasets?.[0]?.data

    if (!Array.isArray(pieValues)) {
      console.warn('饼图数据格式无效:', payload)
      return null
    }
  } else if (!Array.isArray(chartData.datasets)) {
    console.warn('图表 datasets 格式无效:', payload)
    return null
  }

  return {
    id: `chart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'chart',
    role,
    chartType,
    title: payload.title || '图表',
    chartData,
    timestamp
  }
}

const destroyChartInstance = (messageId) => {
  const chartInstance = chartInstances.get(messageId)
  if (chartInstance) {
    chartInstance.destroy()
    chartInstances.delete(messageId)
  }
}

const renderChartMessage = (messageId) => {
  const canvas = chartCanvasRefs.get(messageId)
  const message = messages.value.find(item => item.id === messageId && item.type === 'chart')

  if (!canvas || !message) {
    return
  }

  destroyChartInstance(messageId)

  const normalizedData = normalizeChartData(message.chartType, message.title, message.chartData)
  const shouldShowLegend = message.chartType === 'pie' || normalizedData.datasets.length > 1

  chartInstances.set(messageId, new Chart(canvas, {
    type: message.chartType,
    data: normalizedData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 450,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: shouldShowLegend,
          position: 'bottom',
          labels: {
            color: '#4b5563',
            usePointStyle: true,
            boxWidth: 10,
            padding: 16
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#e5e7eb',
          padding: 12,
          cornerRadius: 10
        }
      },
      scales: message.chartType === 'pie'
        ? undefined
        : {
            x: {
              ticks: {
                color: '#6b7280',
                maxRotation: 0,
                autoSkipPadding: 12
              },
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#6b7280'
              },
              grid: {
                color: '#e5e7eb'
              }
            }
          }
    }
  }))
}

const setChartCanvasRef = (messageId, element) => {
  if (element) {
    chartCanvasRefs.set(messageId, element)
    nextTick(() => renderChartMessage(messageId))
    return
  }

  chartCanvasRefs.delete(messageId)
  destroyChartInstance(messageId)
}

const appendChartMessage = (payload, timestamp) => {
  const chartMessage = createChartMessage(payload, timestamp)

  if (!chartMessage) {
    return false
  }

  messages.value = [...messages.value, chartMessage]
  nextTick(() => renderChartMessage(chartMessage.id))
  scrollToBottom()
  return true
}

const parseFileAttachmentsToMessages = ({
  fileAttachments,
  timestamp,
  role = 'tool',
  skipImageUrls = false,
  startId = Date.now()
}) => {
  const attachments = Array.isArray(fileAttachments) ? fileAttachments : [fileAttachments]
  const parsedMessages = []
  let messageId = startId

  attachments.forEach((attachment) => {
    // 处理 SQL 查询结果
    if (attachment && typeof attachment === 'object' && attachment.type === 'sql_result') {
      parsedMessages.push({
        id: `sql-result-${messageId++}`,
        type: 'sql_result',
        role,
        timestamp,
        ...attachment
      })
      return
    }

    // 处理图表数据
    if (attachment && typeof attachment === 'object' && attachment.type === 'chart') {
      const chartMessage = createChartMessage(attachment, timestamp, role)
      if (chartMessage) {
        parsedMessages.push({
          ...chartMessage,
          id: `chart-${messageId++}`
        })
      }
      return
    }

    // 处理文件 URL（字符串）
    if (typeof attachment === 'string') {
      const fileUrl = attachment.trim().replace(/`/g, '')
      const fileName = fileUrl.split('/').pop() || '文件'

      if (skipImageUrls && isImageFileName(fileName)) {
        return
      }

      parsedMessages.push({
        id: messageId++,
        type: 'tool',
        role,
        fileName,
        fileUrl,
        timestamp
      })
      return
    }

    // 处理新的文件对象格式
    // { type: 'file', file_name: 'report.pdf', ext: 'pdf', url: 'https://...' }
    if (attachment && typeof attachment === 'object') {
      if (attachment.type === 'file' && typeof attachment.url === 'string') {
        const fileUrl = attachment.url.trim().replace(/`/g, '')
        const ext = typeof attachment.ext === 'string' ? attachment.ext.trim() : ''
        const fallbackName = fileUrl.split('/').pop() || (ext ? `文件.${ext}` : '文件')
        const fileName = (attachment.file_name || fallbackName).trim()

        if (skipImageUrls && isImageFileName(fileName)) {
          return
        }

        parsedMessages.push({
          id: messageId++,
          type: 'tool',
          role,
          fileName,
          fileUrl,
          timestamp
        })
        return
      }

      // 处理其他类型的对象（向后兼容）
      const chartMessage = createChartMessage(attachment, timestamp, role)
      if (chartMessage) {
        parsedMessages.push({
          ...chartMessage,
          id: `chart-${messageId++}`
        })
      }
    }
  })

  return parsedMessages
}

const handleToolFileClick = (message) => {
  if (message.fileUrl) {
    window.open(message.fileUrl, '_blank', 'noopener,noreferrer')
  }
}

const handleResultFile = async (fileData) => {
  const { url, name, file_name } = fileData
  const fileName = name || file_name || url.split('/').pop() || '未知文件'
  
  selectedResultFile.value = {
    url,
    name: fileName,
    type: getFileType(fileName),
    content: null,
    loading: true,
    error: null
  }
  
  try {
    const fileType = getFileType(fileName)
    
    if (['pdf'].includes(fileType)) {
      const response = await fetchWithTokenRefresh(url)
      if (response.ok) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        selectedResultFile.value.content = blobUrl
        selectedResultFile.value.isPdf = true
      }
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      selectedResultFile.value.content = url
      selectedResultFile.value.isImage = true
    } else if (['html'].includes(fileType)) {
      const response = await fetchWithTokenRefresh(url)
      if (response.ok) {
        let htmlContent = await response.text()
        // 注入CSS以智能适配竖版和横版页面
        const cssCode = 'html{margin:0;padding:0;width:100%;height:100%}' +
          'body{margin:0;padding:20px;width:max-content;min-width:100%;min-height:100vh;box-sizing:border-box;transform-origin:top left;display:flex;flex-direction:column}' +
          '*{box-sizing:border-box}' +
          'img{max-width:100%;height:auto}' +
          'table{border-collapse:collapse}' +
          'pre,code{overflow:auto}' +
          '.page,[data-page],[class*="page"]{margin:0 auto}' +
          '::-webkit-scrollbar{width:8px;height:8px}' +
          '::-webkit-scrollbar-track{background:#f1f1f1}' +
          '::-webkit-scrollbar-thumb{background:#c1c1c1;border-radius:4px}' +
          '::-webkit-scrollbar-thumb:hover{background:#a8a8a8}'
        
        // 注入JS以自动缩放
        const jsCode = '(function(){' +
          'function adjustScale(){' +
          'var cw=document.body.scrollWidth-40;' +
          'var vw=window.innerWidth-40;' +
          'if(cw>vw){' +
          'var s=vw/cw;' +
          'document.body.style.transform="scale("+s+")";' +
          'document.documentElement.style.minHeight=(window.innerHeight/s)+"px";' +
          '}else{' +
          'document.body.style.transform="scale(1)";' +
          'document.documentElement.style.minHeight="100vh";' +
          '}' +
          '}' +
          'if(document.readyState==="loading"){' +
          'document.addEventListener("DOMContentLoaded",adjustScale);' +
          '}else{adjustScale();}' +
          'window.addEventListener("resize",adjustScale);' +
          'window.addEventListener("load",adjustScale);' +
          'var obs=new MutationObserver(adjustScale);' +
          'obs.observe(document.body,{childList:true,subtree:true,attributes:true});' +
          '})();'
        
        const styleInjection = '<style>' + cssCode + '</style><script>' + jsCode + '<' + '/script>'
        
        // 在head标签中插入样式，如果没有head则添加
        const headEndTag = '<' + '/head>'
        if (htmlContent.includes(headEndTag)) {
          htmlContent = htmlContent.replace(headEndTag, styleInjection + headEndTag)
        } else {
          htmlContent = styleInjection + htmlContent
        }
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const blobUrl = URL.createObjectURL(blob)
        selectedResultFile.value.content = blobUrl
        selectedResultFile.value.isHtml = true
      }
    } else if (['txt', 'md', 'json', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'go', 'rs', 'rb', 'php'].includes(fileType)) {
      const response = await fetchWithTokenRefresh(url)
      if (response.ok) {
        selectedResultFile.value.content = await response.text()
        selectedResultFile.value.isText = true
      }
    } else if (['csv'].includes(fileType)) {
      const response = await fetchWithTokenRefresh(url)
      if (response.ok) {
        const csvText = await response.text()
        selectedResultFile.value.tableData = parseCSV(csvText)
        selectedResultFile.value.isTable = true
        selectedResultFile.value.tableType = 'csv'
      }
    } else if (['xlsx', 'xls'].includes(fileType)) {
      const response = await fetchWithTokenRefresh(url)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const workbook = new Workbook()
        await workbook.xlsx.load(arrayBuffer)
        const worksheet = workbook.worksheets[0]
        const tableData = []
        worksheet.eachRow((row, rowNumber) => {
          // 转换row.values为数组，过滤掉undefined
          const rowData = row.values ? row.values.slice(1) : [] // slice(1)是因为row.values[0]是undefined
          tableData.push(rowData)
        })
        selectedResultFile.value.tableData = tableData
        selectedResultFile.value.isTable = true
        selectedResultFile.value.tableType = 'xlsx'
      }
    } else {
      selectedResultFile.value.content = url
      selectedResultFile.value.isOther = true
    }
  } catch (error) {
    console.error('加载文件失败:', error)
    selectedResultFile.value.error = '文件加载失败'
    selectedResultFile.value.content = url
  } finally {
    selectedResultFile.value.loading = false
  }
}

const getFileType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  return ext
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

const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n')
  const data = lines.map(line => {
    // 简单的CSV解析，处理逗号分隔
    const cells = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    cells.push(current.trim())
    return cells
  })
  return data
}



const handleConfirmToolExecution = async (confirmed, toolConfirmationId) => {
  try {
    const conversationId = currentConversationId.value
    if (!conversationId) {
      ElMessage.error('缺少对话ID，无法确认')
      return
    }
    
    const response = await fetchWithTokenRefresh('/api/agent/confirm_tool_execution', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        confirmed: confirmed
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('工具确认已发送:', result)
      ElMessage.success(result.message || '已发送您的确认')
      
      // 移除确认消息框
      messages.value = messages.value.filter(msg => msg.id !== toolConfirmationId)
    } else {
      ElMessage.error('确认失败，请重试')
    }
  } catch (error) {
    console.error('发送工具确认失败:', error)
    ElMessage.error('发送确认失败，请重试')
  }
}

const handleDownloadFile = async (url, fileName) => {
  try {
    const response = await fetchWithTokenRefresh(url)
    if (!response.ok) {
      throw new Error('下载失败')
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('下载文件失败:', error)
    ElMessage.error('文件下载失败，请重试')
  }
}

const conversationHistory = ref([])
const loading = ref(false)
const isLoading = ref(false)
const currentConversationId = ref(null)

const menuState = ref({
  visible: false,
  conversationId: null,
  position: { x: 0, y: 0 }
})

const confirmDialogVisible = ref(false)
const pendingDeleteId = ref(null)

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
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token_type')
        await ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '确定'
        })
        router.push('/')
        throw err
      } finally {
        isRefreshingToken = false
      }
    } else if (isRefreshingToken) {
      return new Promise((resolve) => {
        subscribeRefreshToken((newToken) => {
          const newTokenType = localStorage.getItem('token_type') || 'Bearer'
          const newHeaders = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            'Authorization': `${newTokenType} ${newToken}`
          }
          resolve(fetch(url, {
            ...options,
            headers: newHeaders
          }))
        })
      })
    }
  }
  
  return response
}

const canSend = computed(() => {
  return (inputMessage.value.trim() || selectedFiles.value.length > 0) && !isGenerating.value
})

const buttonText = computed(() => {
  return isGenerating.value ? '停止生成' : '发送'
})

const handleStopGeneration = async () => {
  try {
    // 调用后端停止接口，让后端完成后续任务
    if (currentConversationId.value) {
      const response = await fetchWithTokenRefresh('/api/agent/stop_generation', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: currentConversationId.value
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('停止生成信号已发送:', data.message)
        ElMessage.success('已发送停止信号')
      } else {
        console.error('停止生成失败')
        ElMessage.warning('停止生成请求失败')
      }
    }
  } finally {
    isGenerating.value = false
  }
}

const handleButtonClick = () => {
  if (isGenerating.value) {
    handleStopGeneration()
  } else {
    handleSendMessage()
  }
}

const highlightCode = (code, language = 'javascript') => {
  code = code
    .replace(/(function|const|let|var|if|else|for|while|return|import|export|from|class|extends|constructor|async|await|try|catch|finally|switch|case|default|break|continue|typeof|instanceof|new|delete|void|throw|static|super|this|true|false|null|undefined)/g, '<span style="color: #d73a49;">$1</span>')
    .replace(/(".*?"|'.*?')/g, '<span style="color: #032f62;">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, '<span style="color: #6a737d;">$1</span>')
    .replace(/(\d+)/g, '<span style="color: #005cc5;">$1</span>')
  return `<pre style="background-color: #f6f8fa; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.4;"><code>${code}</code></pre>`
}

const parseMessageContent = (content) => {
  if (!content) return ''
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let parsed = content.replace(codeBlockRegex, (match, language, code) => {
    return highlightCode(code, language)
  })
  return parsed.replace(/\n/g, '<br>')
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

const fetchConversationHistory = async () => {
  try {
    loading.value = true
    const response = await fetchWithTokenRefresh('/api/agent/query_conversations', {
      method: 'POST',
      body: JSON.stringify({ agent_name: agentName.value })
    })
    if (response.ok) {
      const data = await response.json()
      if (data.data) {
        conversationHistory.value = data.data
      }
    }
  } catch (err) {
    console.error('获取会话历史失败:', err)
  } finally {
    loading.value = false
  }
}

// 根据文件名后缀判断是否为图片（用于历史消息解析，此时没有File对象）
const isImageFileName = (fileName) => {
  if (!fileName) return false
  const ext = fileName.split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

// 解析新格式的消息内容（JSON数组格式）
const parseNewFormatContent = (msg, baseTimestamp) => {
  const parsedMessages = []
  let messageId = Date.now() + Math.random()
  
  try {
    const contentArray = JSON.parse(msg.content)
    
    if (!Array.isArray(contentArray)) {
      // 不是数组，使用旧逻辑
      return null
    }
    
    // 遍历数组，处理每个type元素
    for (const item of contentArray) {
      if (item.type === 'text') {
        // 尝试解析text字段的值
        try {
          const textValue = JSON.parse(item.text)
          if (textValue && textValue.file_attachments) {
            const attachmentMessages = parseFileAttachmentsToMessages({
              fileAttachments: textValue.file_attachments,
              timestamp: baseTimestamp,
              role: msg.role,
              skipImageUrls: true,
              startId: messageId
            })

            parsedMessages.push(...attachmentMessages)
            messageId += attachmentMessages.length
          } else {
            // 没有file_attachments，作为普通文本（跳过空文本，避免空气泡）
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
          // JSON解析失败，当作普通文本处理（跳过空文本，避免空气泡）
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
        // 图片消息
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
    // JSON解析失败，说明不是新格式
    return null
  }
}

// 解析system_push格式的消息
const parseSystemPushMessage = (msg, baseTimestamp) => {
  const parsedMessages = []
  let messageId = Date.now() + Math.random()
  
  try {
    const contentData = JSON.parse(msg.content)

    const chartMessage = createChartMessage(contentData, baseTimestamp, msg.role || 'system_push')
    if (chartMessage) {
      return [chartMessage]
    }
    
    // 检查是否是system_push格式
    if (contentData.role !== 'system_push') {
      return null
    }
    
    // 如果有content字段且不为空，先显示content
    if (contentData.content && contentData.content.trim() !== '') {
      parsedMessages.push({
        id: messageId++,
        type: 'bot',
        role: 'system_push',
        content: contentData.content,
        timestamp: baseTimestamp
      })
    }
    
    // 如果有image_url字段且不为空，单独显示图片
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
    // JSON解析失败，不是system_push格式
    return null
  }
}

const fetchConversationMessages = async (conversationId) => {
  try {
    loading.value = true
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
            if (msg.role === 'tool' && msg.content) {
              try {
                console.log('解析历史 tool 消息, content:', msg.content)
                const contentData = JSON.parse(msg.content)
                console.log('解析后的 contentData:', contentData)
                if (contentData.file_attachments) {
                  const toolMessages = parseFileAttachmentsToMessages({
                    fileAttachments: contentData.file_attachments,
                    timestamp: baseTimestamp,
                    role: 'tool',
                    startId: Date.now() + index
                  })
                  return toolMessages
                } else {
                  console.log('contentData 中没有 file_attachments 字段')
                  return []
                }
              } catch (e) {
                console.error('解析 tool 消息内容失败:', e)
                return []
              }
            } else if (msg.content && msg.content.trim() !== '') {
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
    console.error('加载对话详情失败:', err)
  } finally {
    loading.value = false
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
    console.error('删除会话失败:', err)
    ElMessage.error('删除失败，请重试')
  }
}

const handleSendMessage = async () => {
  if (!canSend.value) return

  const timestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const messageContent = inputMessage.value
  
  // 保存文件信息和URLs用于请求
  const filesInfo = selectedFiles.value
  const fileAttachments = selectedFileUrls.value
  
  // 添加用户文本消息（如果有内容）
  if (messageContent.trim()) {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: timestamp
    }
    messages.value = [...messages.value, userMessage]
  }
  
  // 为每个上传的文件添加独立的消息
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
      agent_name: agentName.value,
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
    let toolMessageId = null
    let shouldUpdateCurrentMessage = true  // 是否应该继续更新当前botMessage
    let hasShownToolCalling = false  // 是否已经显示过tool_calls消息

    const botMessage = {
      id: assistantMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    messages.value = [...messages.value, botMessage]

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
              // 立刻刷新会话列表，无需等待stream完成
              fetchConversationHistory()
            }

            if (data.action === 'render_chart') {
              messages.value = messages.value.filter(msg => !msg.isToolCalling)
              shouldUpdateCurrentMessage = false
              hasShownToolCalling = false
              appendChartMessage(data, new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
              continue
            }

            if (data.role === 'assistant' && data.tool_calls && data.tool_calls.length > 0 && !hasShownToolCalling) {
              // 当assistant消息中有tool_calls时，添加工具调用中的临时消息
              // 使用hasShownToolCalling标志确保只显示一次，避免重复
              hasShownToolCalling = true
              const toolCallsInfo = data.tool_calls
                .map(tc => tc.function?.name || '未知工具')
                .join(', ')
              
              // 移除之前的工具调用消息（如果有的话）
              messages.value = messages.value.filter(msg => !msg.isToolCalling)
              
              // 添加新的工具调用消息
              messages.value = [...messages.value, {
                id: 'tool-calling-' + Date.now(),
                type: 'tool-calling',
                isToolCalling: true,
                content: `正在使用工具中，请稍候...`,
                timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }]
              
              // 重要：停止更新当前botMessage，后续content作为新消息处理
              shouldUpdateCurrentMessage = false
              scrollToBottom()
            }
            
            // 处理system_push消息
            if (data.role === 'system_push') {
              const timestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
              let messageIdForPush = Date.now() + 10
              
              // 处理tool_deny类型：隐藏工具调用中的消息和确认框
              if (data.type === 'tool_deny') {
                // 同时清理tool_calling和tool_confirmation消息
                messages.value = messages.value.filter(msg => !msg.isToolCalling && msg.systemType !== 'tool_confirmation')
                
                // 如果有content字段且不为空，显示否决原因
                if (data.content && data.content.trim() !== '') {
                  messages.value = [...messages.value, {
                    id: messageIdForPush++,
                    type: 'bot',
                    role: 'system_push',
                    systemType: 'tool_deny',
                    content: data.content,
                    timestamp: timestamp
                  }]
                }
                scrollToBottom()
                continue
              }
              
              // 处理tool_confirmation类型：显示确认框
              if (data.type === 'tool_confirmation') {
                const messageId = messageIdForPush++
                messages.value = [...messages.value, {
                  id: messageId,
                  type: 'bot',
                  role: 'system_push',
                  systemType: 'tool_confirmation',
                  content: data.content || '需要用户确认是否允许使用工具',
                  timestamp: timestamp,
                  toolConfirmationId: messageId // 用于后续删除
                }]
                scrollToBottom()
                continue
              }
              
              // 常规system_push消息处理：显示content和image_url
              // 如果有content字段且不为空，先显示content
              if (data.content && data.content.trim() !== '') {
                messages.value = [...messages.value, {
                  id: messageIdForPush++,
                  type: 'bot',
                  role: 'system_push',
                  content: data.content,
                  timestamp: timestamp
                }]
              }
              
              // 如果有image_url字段且不为空，单独显示图片
              if (data.image_url && data.image_url.trim() !== '') {
                messages.value = [...messages.value, {
                  id: messageIdForPush++,
                  type: 'image',
                  role: 'system_push',
                  imageUrl: data.image_url,
                  timestamp: timestamp
                }]
              }
              
              // system_push处理完毕，跳过后续content处理
              scrollToBottom()
              continue
            } else if (data.role === 'tool') {
              // 步骤1: 当role为tool时，无条件隐藏临时工具调用消息，并停止更新当前botMessage
              messages.value = messages.value.filter(msg => !msg.isToolCalling)
              shouldUpdateCurrentMessage = false
              // 重置hasShownToolCalling，允许后续工具调用再次显示"正在使用工具"提示
              hasShownToolCalling = false
              
              // 步骤2: 当role为tool且有content时，处理file_attachments
              if (data.content) {
                try {
                  console.log('收到 tool 消息, content:', data.content)
                  const contentData = JSON.parse(data.content)
                  console.log('解析后的 contentData:', contentData)
                  if (contentData.file_attachments) {
                    const attachmentTimestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    const attachmentMessages = parseFileAttachmentsToMessages({
                      fileAttachments: contentData.file_attachments,
                      timestamp: attachmentTimestamp,
                      role: 'tool',
                      startId: Date.now() + 2
                    })

                    attachmentMessages.forEach((attachmentMessage) => {
                      messages.value = [...messages.value, attachmentMessage]
                    })
                  } else {
                    console.log('contentData 中没有 file_attachments 字段')
                  }
                } catch (e) {
                  console.error('解析 tool 消息内容失败:', e)
                }
              }
            } else if (data.content !== undefined) {
              // 如果当前不应该更新消息，则创建新的botMessage
              if (!shouldUpdateCurrentMessage) {
                assistantMessageId = Date.now() + 3
                fullContent = data.content
                const newBotMessage = {
                  id: assistantMessageId,
                  type: 'bot',
                  content: fullContent,
                  timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
                messages.value = [...messages.value, newBotMessage]
                shouldUpdateCurrentMessage = true
              } else {
                fullContent += data.content
                if (isLoading.value) {
                  isLoading.value = false
                }
                messages.value = messages.value.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              }
              scrollToBottom()
            } else if (data.message !== undefined) {
              // 如果当前不应该更新消息，则创建新的botMessage
              if (!shouldUpdateCurrentMessage) {
                assistantMessageId = Date.now() + 3
                fullContent = data.message
                const newBotMessage = {
                  id: assistantMessageId,
                  type: 'bot',
                  content: fullContent,
                  timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
                messages.value = [...messages.value, newBotMessage]
                shouldUpdateCurrentMessage = true
              } else {
                fullContent += data.message
                if (isLoading.value) {
                  isLoading.value = false
                }
                messages.value = messages.value.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              }
              scrollToBottom()
            } else if (typeof data === 'string') {
              // 如果当前不应该更新消息，则创建新的botMessage
              if (!shouldUpdateCurrentMessage) {
                assistantMessageId = Date.now() + 3
                fullContent = data
                const newBotMessage = {
                  id: assistantMessageId,
                  type: 'bot',
                  content: fullContent,
                  timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
                messages.value = [...messages.value, newBotMessage]
                shouldUpdateCurrentMessage = true
              } else {
                fullContent += data
                if (isLoading.value) {
                  isLoading.value = false
                }
                messages.value = messages.value.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              }
              scrollToBottom()
            }
          } catch (e) {
            console.error('解析响应数据失败:', e)
          }
        }
      }
    }

    messages.value = messages.value.filter(msg => msg.type === 'tool' || msg.type === 'image' || msg.type === 'chart' || msg.type === 'sql_result' || (msg.content && msg.content.trim() !== ''))

    // 检查fullContent是否是新格式JSON，如果是则重新解析
    if (fullContent && fullContent.trim().startsWith('[')) {
      try {
        const mockMsg = { 
          content: fullContent,
          role: 'assistant',
          create_time: new Date().toISOString()
        }
        const baseTimestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const newFormatMessages = parseNewFormatContent(mockMsg, baseTimestamp)
        
        if (newFormatMessages) {
          // 移除旧的botMessage
          messages.value = messages.value.filter(msg => msg.id !== assistantMessageId)
          // 添加新解析的消息
          messages.value = [...messages.value, ...newFormatMessages]
        }
      } catch (e) {
        console.log('fullContent不是新格式JSON，保持原样')
      }
    }

    // 如果没有新conversation，才在这里刷新列表（新conversation在接收时已经刷新过）
    if (!newConversationId) {
      await fetchConversationHistory()
    }
    scrollToBottom()

  } catch (err) {
    console.error('发送消息失败:', err)
    ElMessage.error('发送消息失败，请重试')
  } finally {
    isLoading.value = false
    isGenerating.value = false
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
      // 如果是图片，先压缩再上传
      if (isImageFile(file)) {
        console.log('[上传] 检测到图片文件，开始压缩:', file.name)
        try {
          file = await compressImage(file)
          console.log('[上传] 图片压缩完成')
        } catch (error) {
          console.error('[上传] 图片压缩失败，使用原文件:', error)
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

      console.log('[上传] 开始上传文件:', file.name)
      
      const presignedRes = await getPresignedUrl({ 
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || 'application/octet-stream'
      })
      console.log('[上传] presignedRes:', presignedRes)
      
      if (presignedRes.status === 'success' && presignedRes.data) {
        const { upload_url, oss_key, access_key_id, policy, signature, static_url } = presignedRes.data
        
        console.log('[上传] upload_url:', upload_url)
        console.log('[上传] static_url:', static_url)
        console.log('[上传] 文件类型:', file.type)
        console.log('[上传] 文件大小:', file.size)
        
        // 使用 FormData 构建 POST 请求体
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
        
        console.log('[上传] fetch响应状态码:', uploadResponse.status)
        console.log('[上传] fetch响应headers:', {
          'content-type': uploadResponse.headers.get('content-type'),
          'x-oss-request-id': uploadResponse.headers.get('x-oss-request-id')
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error('[上传] OSS错误响应:', errorText)
          throw new Error(`OSS上传失败: ${uploadResponse.status} - ${errorText}`)
        }

        selectedFileUrls.value.push(static_url)
        
        const index = selectedFiles.value.findIndex(f => f.file_id === fileInfo.file_id)
        if (index !== -1) {
          selectedFiles.value[index].uploading = false
          selectedFiles.value[index].static_url = static_url
        }
        
        console.log('[上传] 文件上传成功:', file.name)
      } else {
        // 处理presignedRes失败的情况
        const errorMessage = presignedRes.detail || presignedRes.message || '获取上传链接失败'
        console.error('[上传] 获取presigned URL失败:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('[上传] 文件上传失败:', error)
      console.error('[上传] 错误堆栈:', error.stack)
      
      // request.js的拦截器已经显示过错误信息了，这里只处理UI状态
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
    
    // 同时移除对应的URL
    const urlIndex = selectedFileUrls.value.findIndex(url => 
      removedFile.static_url && url === removedFile.static_url
    )
    if (urlIndex !== -1) {
      selectedFileUrls.value.splice(urlIndex, 1)
    }
  }
}

const handleNewConversation = () => {
  messages.value = []
  currentConversationId.value = null
  selectedFiles.value = []
  selectedFileUrls.value = []
  selectedResultFile.value = null
}

const handleLoadConversation = async (conversationId) => {
  currentConversationId.value = conversationId
  selectedResultFile.value = null
  await fetchConversationMessages(conversationId)
  scrollToBottom()
}

const handleMenuClick = (e, conversationId) => {
  if (menuState.value.visible && menuState.value.conversationId === conversationId) {
    handleMenuClose()
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  const sidebar = e.currentTarget.closest('.sidebar')
  const sidebarRect = sidebar?.getBoundingClientRect()
  menuState.value = {
    visible: true,
    conversationId,
    position: {
      x: rect.right - (sidebarRect ? sidebarRect.left : 0),
      y: rect.top - (sidebarRect ? sidebarRect.top : 0)
    }
  }
}

const handleMenuClose = () => {
  menuState.value = {
    visible: false,
    conversationId: null,
    position: { x: 0, y: 0 }
  }
}

const handleDeleteConversation = (conversationId) => {
  pendingDeleteId.value = conversationId
  confirmDialogVisible.value = true
  handleMenuClose()
}

const handleConfirmDelete = async () => {
  if (pendingDeleteId.value) {
    await deleteConversation(pendingDeleteId.value)
  }
  confirmDialogVisible.value = false
  pendingDeleteId.value = null
}

const goHome = () => {
  router.push('/')
}

const handleGoLogin = () => {
  router.push('/auth')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('nick_name')
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error) {
    console.log('取消退出')
  }
}

onMounted(async () => {
  // Strip `title` attributes from rendered markdown links to prevent the browser
  // from showing the raw URL as a native tooltip on hover.
  nextTick(() => {
    messagesListRef.value?.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a')
      if (link && link.hasAttribute('title')) {
        link.removeAttribute('title')
      }
    })
  })

  const name = route.query.name || sessionStorage.getItem('current_agent_name') || ''
  agentName.value = name
  
  // 保存当前 agent 名称，以便从其他页面返回时恢复
  if (name) {
    sessionStorage.setItem('current_agent_name', name)
  }
  
  try {
    const res = await queryAllAgentsInfo({ agent_name: name, language: 'zh' })
    console.log('[DEBUG] Agent info response:', res)
    
    // 后端返回格式: { success: true, data: [{...}] }
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const agentData = res.data[0]
      console.log('[DEBUG] Selected agent data:', agentData)
      console.log('[DEBUG] Starter prompts from API:', agentData.starter_prompts)
      
      agentNickName.value = agentData.nick_name || name
      agentAvatar.value = agentData.avatar || ''
      agentDescription.value = agentData.description || '我是你的AI助手，有什么可以帮到你的？'
      starterPrompts.value = Array.isArray(agentData.starter_prompts) ? agentData.starter_prompts : []
      
      console.log('[DEBUG] Final starter prompts set to:', starterPrompts.value)
    } else {
      console.warn('[DEBUG] API returned no agent data. Response:', res)
      agentNickName.value = name
      agentDescription.value = '我是你的AI助手，有什么可以帮到你的？'
      starterPrompts.value = []
    }
  } catch (error) {
    console.error('Failed to fetch agent info:', error)
    agentNickName.value = name
    agentDescription.value = '我是你的AI助手，有什么可以帮到你的？'
    starterPrompts.value = []
  }
  
  // 获取用户信息（包括头像）
  try {
    const userProfile = await getProfile()
    if (userProfile && userProfile.avatar_url) {
      userAvatar.value = userProfile.avatar_url
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    // 如果获取失败，继续使用默认头像
  }
  
  fetchConversationHistory()
})

onBeforeUnmount(() => {
  chartInstances.forEach(chart => chart.destroy())
  chartInstances.clear()
  chartCanvasRefs.clear()
})

// 监听路由变化，确保每次回到 /agent 时都加载 conversation 历史和用户信息
watch(() => route.path, async (newPath) => {
  if (newPath === '/agent' && agentName.value) {
    console.log('[路由] 返回到 /agent，重新加载 conversation 历史和用户信息')
    fetchConversationHistory()
    
    // 重新获取用户信息，以获取最新的头像
    try {
      const userProfile = await getProfile()
      if (userProfile && userProfile.avatar_url) {
        userAvatar.value = userProfile.avatar_url
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }


  }
})

// 推荐问题的emoji列表 - 支持循环分配
const promptEmojis = ['💡', '❓', '💬', '🎯', '🚀', '✨', '🔍', '💭', '🎨', '⚡']

// 根据索引获取对应的emoji，超过数量则循环
const getPromptEmoji = (index) => {
  return promptEmojis[index % promptEmojis.length]
}

const handleStarterPromptClick = (prompt) => {
  inputMessage.value = prompt
  handleSendMessage()
}



</script>

<style scoped lang="scss">
// ── Design tokens ─────────────────────────────────────────────────────────
$primary: #6366f1;
$primary-dark: #4f46e5;
$text: #111827;
$text-muted: #6b7280;
$bg: #f8f9fb;
$border: #e5e7eb;
$sidebar-w: 260px;
$header-h: 56px;

// ── Page shell ─────────────────────────────────────────────────────────────
.agent-work-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg;
  overflow: hidden;
}

// ── Header ─────────────────────────────────────────────────────────────────
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px solid $border;
  z-index: 100;
  padding: 0 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 24px;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  .logo-image { width: 90px; height: 56px; object-fit: contain; }
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;

  .user-info-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-name { color: $text; font-weight: 500; font-size: 0.95rem; }

  :deep(.el-button--primary) {
    background: $primary;
    border-color: $primary;
    &:hover { background: $primary-dark; border-color: $primary-dark; }
  }
  :deep(.el-button--text), :deep(.el-button.is-text) {
    color: $primary;
    &:hover { background: rgba(99,102,241,0.08); }
  }
  :deep(.el-button--default) {
    color: $text-muted;
    border-color: $border;
    &:hover { color: $primary; border-color: $primary; }
  }
}

// ── Main layout ─────────────────────────────────────────────────────────────
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-top: 60px;
}

.sidebar {
  width: $sidebar-w;
  background: #fff;
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.new-chat-btn {
  width: 100%;
  margin: 12px 0;
  padding: 12px 16px;
  background: transparent;
  color: $primary;
  border: 2px solid $primary;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  &:hover {
    background: $primary;
    color: #fff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 6px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
}

.loading, .empty {
  padding: 20px;
  text-align: center;
  color: $text-muted;
  font-size: 0.85rem;
}

.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  &:hover { background: #f3f4f6; }
  &.active { background: #eef2ff; }
  .conversation-info {
    flex: 1;
    min-width: 0;
    .conversation-title {
      font-size: 0.875rem;
      color: $text;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }
    .conversation-time {
      font-size: 0.75rem;
      color: $text-muted;
      margin-top: 2px;
    }
  }
  .menu-btn {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    cursor: pointer;
    color: $text-muted;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s;
    &:hover { background: #e5e7eb; color: $text; }
  }
  &:hover .menu-btn { opacity: 1; }
}

.context-menu {
  position: absolute;
  background: #fff;
  border: 1px solid $border;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 100;
  min-width: 120px;
  padding: 4px;
  button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 7px 12px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: #dc2626;
    border-radius: 6px;
    transition: background 0.15s;
    &:hover { background: #fef2f2; }
  }
}

// ── Chat area ─────────────────────────────────────────────────────────────
.chat-area {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.chat-split-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $bg;
}

// ── Welcome ─────────────────────────────────────────────────────────────────
.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 20px 24px 40px;
  width: 100%;
  gap: 24px;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8f9fb 0%, #f0f3ff 100%);
}

.welcome-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
  border: 1px solid #e5e7eb;
}

.welcome-header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.welcome-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  .avatar-image { width: 100%; height: 100%; object-fit: cover; }
  .avatar-placeholder { font-size: 1.8rem; }
}

.welcome-info {
  flex: 1;
  min-width: 0;
}

.welcome-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: $text;
  margin-bottom: 4px;
  line-height: 1.4;
}

.welcome-desc {
  font-size: 0.85rem;
  color: $text-muted;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tutorial-btn-new {
  padding: 8px 12px;
  border-radius: 10px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
  &:hover {
    background: $primary;
    border-color: $primary;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: scale(1.05);
  }
  &:active { transform: scale(0.95); }
}

.prompts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompts-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: $text;
  padding: 0 4px;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.prompt-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  &:hover {
    border-color: $primary;
    background: #f8f9ff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
  }
  &:active { transform: translateY(0); }
}

.prompt-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.prompt-text {
  font-size: 0.85rem;
  color: $text;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
}

.tutorial-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  cursor: pointer;
  color: $primary;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s, border-color 0.2s;
  &:hover { background: #e0e7ff; border-color: $primary; }
}

.starter-prompts {
  width: 100%;
  margin-bottom: 24px;
  .prompts-label { font-size: 0.85rem; color: $text-muted; margin-bottom: 10px; }
  .prompts-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .prompt-item {
    padding: 7px 14px;
    background: #fff;
    border: 1px solid $border;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    color: $text;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: $primary; background: #eef2ff; color: $primary; }
  }
}

.input-section {
  width: 100%;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

// ── Messages ─────────────────────────────────────────────────────────────
.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 820px;
  &.user { flex-direction: row-reverse; align-self: flex-end; }
  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #eef2ff;
    color: $primary;
    font-size: 0.8rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    &.has-image { background: transparent; }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
  }
  &.user .message-avatar { background: $primary; color: #fff; }
  .message-content { flex: 1; min-width: 0; }
}

.message-bubble {
  display: inline-block;
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 100%;
  &.user {
    background: $primary;
    color: #fff;
    border-bottom-right-radius: 4px;
  }
}

.message-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.9rem;
  line-height: 1.6;
  font-family: inherit;
  color: inherit;
}

.ai-message-content {
  background: #fff;
  border: 1px solid $border;
  border-radius: 12px;
  border-top-left-radius: 4px;
  padding: 12px 16px;
  font-size: 0.9rem;
  line-height: 1.7;
  color: $text;
  max-width: 100%;
  .message-time {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 8px;
  }
}

.tool-message-content {
  .file-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    width: min(100%, 360px);
    padding: 14px 16px 14px 18px;
    background: linear-gradient(135deg, #fffdf8 0%, #fff 54%, #f7fbff 100%);
    border: 1px solid rgba(17, 24, 39, 0.08);
    border-radius: 18px;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: rgba(79, 70, 229, 0.28);
      box-shadow: 0 18px 38px rgba(79, 70, 229, 0.14);
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: none;
      border-color: rgba(79, 70, 229, 0.48);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.14);
    }

    .file-card-accent {
      position: absolute;
      inset: 0 auto 0 0;
      width: 5px;
      background: linear-gradient(180deg, #0f766e 0%, #4f46e5 100%);
    }

    .file-card-icon-shell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, #fef3c7 0%, #e0f2fe 100%);
      flex-shrink: 0;
    }

    .file-card-icon {
      font-size: 1.45rem;
      line-height: 1;
    }

    .file-card-ext {
      position: absolute;
      right: -6px;
      bottom: -6px;
      padding: 3px 7px;
      border-radius: 999px;
      background: #111827;
      color: #fff;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      box-shadow: 0 8px 18px rgba(17, 24, 39, 0.18);
    }

    .file-card-info { flex: 1; min-width: 0; }

    .file-card-eyebrow {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0f766e;
    }

    .file-card-name {
      margin-top: 4px;
      font-size: 0.94rem;
      font-weight: 700;
      color: $text;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-card-hint {
      margin-top: 6px;
      font-size: 0.76rem;
      color: $text-muted;
    }

    .file-card-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: stretch;
      padding: 0 12px;
      border-radius: 999px;
      background: #111827;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .action-label {
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .action-icon {
      font-size: 0.95rem;
      line-height: 1;
    }
  }
}

.image-message-content {
  .message-image { max-width: 320px; border-radius: 8px; display: block; }
}

.chart-message-content {
  width: min(100%, 720px);

  .chart-card {
    background: #fff;
    border: 1px solid $border;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .chart-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .chart-card-title {
    font-size: 0.98rem;
    font-weight: 700;
    color: $text;
    line-height: 1.45;
  }

  .chart-card-subtitle {
    margin-top: 4px;
    font-size: 0.78rem;
    color: $text-muted;
  }

  .chart-card-badge {
    flex-shrink: 0;
    padding: 5px 10px;
    border-radius: 999px;
    background: #eef2ff;
    color: $primary-dark;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .chart-canvas-wrapper {
    position: relative;
    height: 320px;
  }

  .message-time {
    margin-top: 12px;
    font-size: 0.75rem;
    color: #9ca3af;
  }
}

.sql-result-message-content {
  width: min(100%, 780px);

  .sql-result-card {
    background: #fff;
    border: 1px solid $border;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }

  .sql-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid $border;
  }

  .sql-result-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.98rem;
    font-weight: 700;
    color: $text;
  }

  .sql-result-icon {
    font-size: 1.2rem;
  }

  .sql-result-badge {
    flex-shrink: 0;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;

    &.success {
      background: #dcfce7;
      color: #166534;
    }

    &.error {
      background: #fee2e2;
      color: #991b1b;
    }
  }

  .sql-result-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sql-timing-info {
    display: flex;
    gap: 20px;
    padding: 12px;
    background: #f8f9fb;
    border-radius: 8px;
  }

  .timing-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .timing-label {
    font-size: 0.75rem;
    color: $text-muted;
    font-weight: 500;
  }

  .timing-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: $primary;
  }

  .sql-query-section,
  .sql-results-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sql-query-title,
  .results-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: $text;
  }

  .sql-query-code,
  .error-sql-code {
    background: #f8f9fb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 0.8rem;
    font-family: 'Monaco', 'Courier New', monospace;
    color: $text-muted;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .sql-results-table {
    overflow-x: auto;
    border: 1px solid $border;
    border-radius: 8px;

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;

      thead {
        background: #f8f9fb;
        border-bottom: 1px solid $border;
      }

      th {
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        color: $text;
      }

      td {
        padding: 10px 12px;
        border-bottom: 1px solid #f3f4f6;
        color: $text;
        word-break: break-word;
        max-width: 200px;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }
  }

  .sql-empty-result {
    padding: 20px;
    text-align: center;
    color: $text-muted;
    font-size: 0.9rem;
    background: #f8f9fb;
    border-radius: 8px;
  }

  .sql-result-error {
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .error-message {
    color: #991b1b;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .error-sql {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .error-sql-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-muted;
  }

  .message-time {
    margin-top: 12px;
    font-size: 0.75rem;
    color: #9ca3af;
  }
}

.tool-calling-message {
  .tool-calling-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: #f3f4f6;
    border-radius: 8px;
    color: $text-muted;
    font-size: 0.875rem;
  }
  .tool-calling-spinner { display: flex; gap: 3px; }
  .spinner-dot {
    width: 5px;
    height: 5px;
    background: $primary;
    border-radius: 50%;
    animation: dotPulse 1.2s infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

.tool-confirmation-message {
  .tool-confirmation-content {
    background: #fff;
    border: 1px solid #fbbf24;
    border-radius: 10px;
    padding: 14px 16px;
    max-width: 480px;
  }
  .confirmation-text { font-size: 0.9rem; color: $text; margin-bottom: 12px; }
  .confirmation-buttons { display: flex; gap: 10px; }
  .confirmation-btn {
    padding: 6px 16px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: background 0.15s;
  }
  .allow-btn { background: $primary; color: #fff; &:hover { background: $primary-dark; } }
  .deny-btn { background: #f3f4f6; color: $text-muted; &:hover { background: #e5e7eb; } }
}

.loading-message {
  display: flex;
  gap: 12px;
  .message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    &.has-image { background: transparent; }
  }
  .ai-message-content { background: #fff; border: 1px solid $border; border-radius: 12px; border-top-left-radius: 4px; padding: 12px 16px; }
  .typing { color: $text-muted; font-size: 0.9rem; }
}

.attachments { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }

.attachment-item {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.15);
  padding: 3px 8px;
  border-radius: 4px;
  .message-item:not(.user) & {
    color: $text-muted;
    background: #f3f4f6;
  }
}

// ── Input area ─────────────────────────────────────────────────────────────
.input-area {
  padding: 12px 20px 16px;
  background: #fff;
  border-top: 1px solid $border;
}

.selected-files-preview {
  margin-bottom: 8px;
  .preview-title { font-size: 0.8rem; color: $text-muted; margin-bottom: 6px; }
  .files-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .file-preview-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f3f4f6;
    border: 1px solid $border;
    border-radius: 6px;
    padding: 5px 8px;
    max-width: 200px;
    &.is-image { background: #fff; }
    .image-thumbnail { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
    .file-icon { font-size: 1.2rem; flex-shrink: 0; }
    .file-info {
      min-width: 0;
      .file-name { font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; color: $text; }
      .file-status { font-size: 0.75rem; color: $text-muted; }
    }
    .file-remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: $text-muted;
      font-size: 0.7rem;
      padding: 2px;
      flex-shrink: 0;
      border-radius: 3px;
      &:hover { background: #e5e7eb; color: $text; }
    }
  }
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid $border;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  textarea {
    resize: none;
    border: none;
    outline: none;
    padding: 12px 14px;
    font-size: 0.9rem;
    line-height: 1.6;
    color: $text;
    min-height: 80px;
    max-height: 200px;
    font-family: inherit;
    background: transparent;
    &::placeholder { color: #9ca3af; }
  }
  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-top: 1px solid $border;
    background: #fafafa;
  }
}

.upload-btn {
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  color: $text-muted;
  font-size: 1.1rem;
  transition: background 0.15s;
  &:hover { background: #f3f4f6; color: $text; }
}

.send-btn {
  padding: 7px 20px;
  background: $primary;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
  &:hover:not(:disabled) { background: $primary-dark; }
  &:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }
}

// ── Dialogs ─────────────────────────────────────────────────────────────────
:deep(.el-dialog__body) { padding: 16px 20px; }
:deep(.el-dropdown-menu__item) { font-size: 0.875rem; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid $border;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

// ── Tutorial dialog ─────────────────────────────────────────────────────────
.tutorial-dialog-content {
  min-height: 300px;
  max-height: 60vh;
  overflow-y: auto;
}

.tutorial-loading, .tutorial-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: $text-muted;
  font-size: 0.9rem;
  .error-icon { font-size: 2rem; }
}

.tutorial-content { font-size: 0.9rem; line-height: 1.7; color: $text; }

// ── Animations ─────────────────────────────────────────────────────────────
@keyframes dotPulse {
  0%, 100% { transform: scale(0.6); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid $border;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

</style>
