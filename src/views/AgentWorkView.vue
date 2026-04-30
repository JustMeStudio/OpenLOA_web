<template>
  <div class="agent-work-page">
    <header class="layout-header">
      <div class="header-left">
        <div class="logo" @click="goHome">
          <img src="/logo.png" alt="OpenLOA" class="logo-image" />
        </div>
        <div class="agent-title">
          <span class="divider">|</span>
          <span class="agent-name">{{ agentName }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="balance-info">
          <div class="balance-item">
            <span class="balance-label">💳 Credit</span>
            <span class="balance-value">{{ credit }}</span>
          </div>
          <div class="balance-item">
            <span class="balance-label">🔑 Token</span>
            <span class="balance-value">{{ formatNumber(token) }}</span>
          </div>
          <button class="recharge-btn" @click="handleOpenRechargeDialog">
            💰 充值
          </button>
        </div>
        <el-dropdown trigger="click">
          <div class="user-info">
            <el-avatar :size="36" :src="userAvatar" icon="UserFilled" />
            <span class="username">{{ nickName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleProfile">
                <el-icon><User /></el-icon>
                {{ t('common.profile') }}
              </el-dropdown-item>
              <el-dropdown-item @click="handleSettings">
                <el-icon><Setting /></el-icon>
                {{ t('common.settings') }}
              </el-dropdown-item>
              <el-dropdown-item @click="handleAssets">
                <el-icon><Wallet /></el-icon>
                {{ t('common.assets') }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                {{ t('common.logout') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-content">
      <aside class="sidebar">
        <button 
          class="new-chat-btn"
          @click="handleNewConversation"
        >
          <span>🆕</span>
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
              <div class="welcome-avatar">
                <img :src="agentAvatar" alt="avatar" class="avatar-image" v-if="agentAvatar" />
                <div class="avatar-placeholder" v-else>🤖</div>
              </div>
              <div class="welcome-title">
                {{ agentNickName }}
              </div>
              <div class="welcome-desc">
                {{ agentDescription }}
              </div>

              <!-- 使用教程入口 -->
              <div class="tutorial-entry">
                <button 
                  class="tutorial-btn"
                  @click="handleOpenTutorial"
                  :loading="tutorialLoading"
                >
                  <span class="tutorial-icon">📚</span>
                  <span class="tutorial-text">使用教程</span>
                </button>
              </div>

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
                    v-if="message.type === 'user' || message.type === 'tool' || message.type === 'image' || (message.content && message.content.trim() !== '')"
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
                        <div 
                          class="file-card"
                          @click="handleToolFileClick(message)"
                        >
                          <div class="file-card-icon">
                            <span>{{ getFileIcon(message.fileName) }}</span>
                          </div>
                          <div class="file-card-info">
                            <div class="file-card-name">{{ message.fileName || '文件' }}</div>
                            <div class="file-card-hint">点击查看</div>
                          </div>
                          <div class="file-card-action">
                            <span class="action-icon">→</span>
                          </div>
                        </div>
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

          <div class="chat-right">
            <div class="result-render-panel">
              <div class="panel-header">
                <span class="panel-title">输出结果</span>
              </div>
              <div class="panel-content">
                <div class="empty-result" v-if="!selectedResultFile">
                  <div class="empty-icon">📄</div>
                  <div class="empty-text">等待AI输出结果文件...</div>
                </div>
                <div v-else class="result-display">
                  <div class="result-file-info">
                    <span class="file-name">
                      <span class="file-icon" v-if="selectedResultFile.isImage">🖼️</span>
                      <span class="file-icon" v-else-if="selectedResultFile.isPdf">📄</span>
                      <span class="file-icon" v-else-if="selectedResultFile.isText">📝</span>
                      <span class="file-icon" v-else-if="selectedResultFile.isTable">📊</span>
                      <span class="file-icon" v-else>📁</span>
                      {{ selectedResultFile.name }}
                    </span>
                    <button 
                      v-if="selectedResultFile.url" 
                      @click="handleDownloadFile(selectedResultFile.url, selectedResultFile.name)"
                      class="download-btn"
                    >
                      <span class="download-icon">⬇️</span>
                      <span>下载文件</span>
                    </button>
                  </div>
                  <div class="result-content">
                    <div v-if="selectedResultFile.loading" class="loading-state">
                      <div class="loading-spinner"></div>
                      <span>文件加载中...</span>
                    </div>
                    <div v-else-if="selectedResultFile.error" class="error-state">
                      <div class="error-icon">⚠️</div>
                      <span>{{ selectedResultFile.error }}</span>
                      <button 
                        v-if="selectedResultFile.url" 
                        @click="handleDownloadFile(selectedResultFile.url, selectedResultFile.name)"
                        class="fallback-btn"
                      >
                        <span class="download-icon">⬇️</span>
                        <span>下载文件</span>
                      </button>
                    </div>
                    <div v-else-if="selectedResultFile.isImage" class="image-preview">
                      <img :src="selectedResultFile.content" :alt="selectedResultFile.name" class="preview-image" />
                    </div>
                    <div v-else-if="selectedResultFile.isPdf" class="pdf-preview">
                      <iframe :src="selectedResultFile.content" class="pdf-iframe"></iframe>
                    </div>
                    <div v-else-if="selectedResultFile.isHtml" class="html-preview">
                      <iframe :src="selectedResultFile.content" class="html-iframe"></iframe>
                    </div>
                    <div v-else-if="selectedResultFile.isText" class="text-preview">
                      <pre class="text-content">{{ selectedResultFile.content }}</pre>
                    </div>
                    <div v-else-if="selectedResultFile.isTable" class="table-preview">
                      <div class="table-container">
                        <table class="data-table">
                          <thead v-if="selectedResultFile.tableData && selectedResultFile.tableData.length > 0">
                            <tr>
                              <th v-for="(cell, index) in selectedResultFile.tableData[0]" :key="index" class="table-header-cell">
                                {{ cell }}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(row, rowIndex) in selectedResultFile.tableData.slice(1)" :key="rowIndex" class="table-row">
                              <td v-for="(cell, colIndex) in row" :key="colIndex" class="table-cell" :title="cell">
                                {{ cell }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div v-else class="other-preview">
                      <div class="file-icon">📁</div>
                      <span>不支持的文件格式</span>
                      <button 
                        v-if="selectedResultFile.url" 
                        @click="handleDownloadFile(selectedResultFile.content, selectedResultFile.name)"
                        class="fallback-btn"
                      >
                        <span class="download-icon">⬇️</span>
                        <span>下载文件</span>
                      </button>
                    </div>
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

    <!-- 使用教程弹窗 -->
    <el-dialog
      v-model="showTutorialDialog"
      :title="`${agentNickName} - 使用教程`"
      width="90%"
      :close-on-click-modal="false"
      class="tutorial-dialog"
    >
      <div class="tutorial-dialog-content">
        <div v-if="tutorialLoading" class="tutorial-loading">
          <div class="loading-spinner"></div>
          <span>加载教程中...</span>
        </div>
        <div v-else-if="tutorialError" class="tutorial-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">{{ tutorialError }}</div>
        </div>
        <div v-else class="tutorial-content">
          <MarkdownRender :content="tutorialContent" :show-tooltips="false" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showTutorialDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 充值弹窗 -->
    <el-dialog
      v-model="showRechargeDialog"
      title="充值账户"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="recharge-dialog-content">
        <div class="recharge-main">
          <!-- 套餐列表 - 左侧 -->
          <div class="packages-section" v-if="packages.length > 0">
            <div class="section-title">选择套餐</div>
            <div class="packages-grid">
              <div 
                v-for="pkg in packages" 
                :key="pkg.name"
                class="package-card"
                :class="{ active: selectedPackage === pkg.name }"
                @click="selectedPackage = pkg.name; customAmount = ''"
              >
                <div class="package-amount">¥{{ pkg.amount }}</div>
                <div class="package-description">{{ pkg.description }}</div>
                <div class="package-benefits">
                  <span class="benefit">💳 +{{ pkg.credit }} Credit</span>
                  <span class="benefit">🔑 +{{ formatNumber(pkg.token) }} Token</span>
                </div>
                <div class="package-discount" v-if="pkg.discount < 1">
                  节省 {{ ((1 - pkg.discount) * 100).toFixed(0) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧分隔线 -->
          <div class="divider-vertical"></div>

          <!-- 自定义金额 - 右侧 -->
          <div class="custom-section">
            <div class="section-title">或自定义充值</div>
            <div class="custom-content">
              <div class="custom-input-wrapper">
                <el-input-number 
                  v-model="customAmount"
                  @change="selectedPackage = null"
                  :min="0"
                  :max="99999"
                  placeholder="输入金额（元）"
                  class="custom-input"
                />
                <span v-if="customPriceLoading" class="loading-text">计算中...</span>
              </div>
              
              <!-- 自定义金额的预览信息 -->
              <div class="custom-preview" v-if="customAmount && customPriceInfo">
                <div class="preview-row">
                  <span class="label">金额</span>
                  <span class="value price">¥{{ customPriceInfo.amount }}</span>
                </div>
                <div class="preview-row" v-if="customPriceInfo.discount_rate < 1">
                  <span class="label">优惠</span>
                  <span class="value discount">节省 {{ ((1 - customPriceInfo.discount_rate) * 100).toFixed(0) }}%</span>
                </div>
                <div class="preview-row">
                  <span class="label">Credit</span>
                  <span class="value benefit-text">+{{ customPriceInfo.credit }}</span>
                </div>
                <div class="preview-row">
                  <span class="label">Token</span>
                  <span class="value benefit-text">+{{ formatNumber(customPriceInfo.token) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 套餐选中后的费用预览 -->
        <div class="price-preview" v-if="selectedPackage && !customAmount">
          <div class="preview-item">
            <span>充值金额:</span>
            <span class="price">¥{{ getRechargeAmount() }}</span>
          </div>
          <div class="preview-item" v-if="getRechargeInfo().discount > 0">
            <span>优惠:</span>
            <span class="discount">节省 {{ (getRechargeInfo().discount * 100).toFixed(0) }}%</span>
          </div>
          <div class="preview-item">
            <span>获得 Credit:</span>
            <span class="benefit-text">{{ getRechargeInfo().credit }} 个</span>
          </div>
          <div class="preview-item">
            <span>获得 Token:</span>
            <span class="benefit-text">{{ formatNumber(getRechargeInfo().token) }} 个</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleRecharge"
          :loading="loadingRecharge"
          :disabled="!(selectedPackage || customAmount)"
        >
          确认充值
        </el-button>
      </template>
    </el-dialog>

    <!-- 支付成功弹窗 -->
    <el-dialog
      v-model="showPaymentSuccessDialog"
      title="支付成功"
      width="420px"
      align-center
      :close-on-click-modal="false"
    >
      <div class="payment-success-content">
        <div class="payment-success-icon">
          <el-icon :size="56" color="#22c55e"><CircleCheck /></el-icon>
        </div>
        <div class="payment-success-title">充值成功！</div>
        <div class="payment-success-order">订单号：{{ paymentSuccessOrderId }}</div>
        <div class="payment-success-tip">账户余额已更新，感谢您的充值。</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showPaymentSuccessDialog = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 悬浮公告面板 -->
    <div class="announcement-floating-panel" :class="{ active: showAnnouncementPanel }">
      <div v-if="showAnnouncementPanel" class="announcement-panel-content">
        <div class="panel-header">
          <span class="panel-title">📢 公告板</span>
          <button class="close-btn" @click="showAnnouncementPanel = false">✕</button>
        </div>
        <div class="panel-body">
          <div v-if="loadingAnnouncements" class="loading-announcement">
            <span class="spinner"></span>
            <span>加载中...</span>
          </div>
          <div v-else-if="announcements.length === 0" class="no-announcement">
            暂无公告
          </div>
          <div v-else class="announcements-list">
            <div 
              v-for="(announcement, index) in announcements"
              :key="index"
              class="announcement-item"
              :class="{ active: index === currentAnnouncementIndex }"
              @click="currentAnnouncementIndex = index"
            >
              <div class="item-header">
                <span class="item-type" :class="`type-${announcement.type}`">
                  {{ getAnnouncementTypeLabel(announcement.type) }}
                </span>
                <span class="item-badge" v-if="index === currentAnnouncementIndex">●</span>
              </div>
              <div class="item-title">{{ announcement.title }}</div>
              <div class="item-message">{{ announcement.message }}</div>
              <div v-if="announcement.startTime" class="item-time">
                {{ announcement.startTime }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮公告按钮 -->
    <button 
      class="announcement-float-btn"
      @click="handleToggleAnnouncementPanel"
      :title="`${announcements.length} 条公告`"
    >
      <span class="float-btn-icon">📢</span>
      <span class="float-btn-count" v-if="announcements.length > 0">{{ announcements.length }}</span>
    </button>

    <!-- AI客服模块 -->
    <CustomerServiceChat />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MarkdownRender } from 'markstream-vue'
import { Workbook } from 'exceljs'
import { refreshToken, getProfile } from '@/api/auth'
import { queryAllAgentsInfo, getPresignedUrl, getBillingBalance, getPackages, recharge, calculateCustomPrice, getAnnouncements, getPaymentStatus } from '@/api/agent'
import { isImageFile, compressImage } from '@/utils/imageCompress'
import CustomerServiceChat from '@/components/CustomerServiceChat.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const agentName = ref('')
const agentNickName = ref('')
const agentAvatar = ref('')
const agentDescription = ref('')
const starterPrompts = ref([])
const nickName = ref(localStorage.getItem('nick_name') || '用户')
const userAvatar = ref('')
const credit = ref(0)
const token = ref(0)

// 公告数据
const announcements = ref([])
const loadingAnnouncements = ref(false)
const currentAnnouncementIndex = ref(0)

// 加载公告数据
const loadAnnouncements = async (lang = null) => {
  if (loadingAnnouncements.value) return
  
  loadingAnnouncements.value = true
  try {
    // 如果未提供语言参数，使用当前 locale
    const language = lang || getLanguageCode(locale.value)
    const response = await getAnnouncements({ language })
    if (response && response.data) {
      announcements.value = response.data
    } else {
      announcements.value = []
    }
  } catch (error) {
    console.error('获取公告失败:', error)
    announcements.value = []
    ElMessage.error('获取公告失败，请稍后重试')
  } finally {
    loadingAnnouncements.value = false
  }
}

// 公告面板相关
const showAnnouncementPanel = ref(false)

const getAnnouncementTypeLabel = (type) => {
  const typeMap = {
    'maintenance': '🔧 维护',
    'important': '⚠️ 重要',
    'feature': '✨ 新功能',
    'update': '📝 更新'
  }
  return typeMap[type] || '📢 公告'
}

// 处理公告面板的打开/关闭
const handleToggleAnnouncementPanel = async () => {
  showAnnouncementPanel.value = !showAnnouncementPanel.value
  
  // 打开时加载公告数据
  if (showAnnouncementPanel.value && announcements.value.length === 0) {
    await loadAnnouncements()
  }
}

// 充值相关
const showRechargeDialog = ref(false)
const packages = ref([])
const selectedPackage = ref(null)
const customAmount = ref('')
const loadingPackages = ref(false)
const loadingRecharge = ref(false)
const customPriceInfo = ref(null)
const customPriceLoading = ref(false)
let customPriceDebounceTimer = null

// 支付轮询相关
let paymentPollingTimer = null
let paymentWindow = null
const showPaymentSuccessDialog = ref(false)
const paymentSuccessOrderId = ref('')

const stopPaymentPolling = () => {
  if (paymentPollingTimer) {
    clearInterval(paymentPollingTimer)
    paymentPollingTimer = null
  }
}

const openPaymentWindow = (htmlContent) => {
  const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
  if (popup) {
    popup.document.open()
    popup.document.write(htmlContent)
    popup.document.close()
    paymentWindow = popup
  } else {
    ElMessage.warning('弹窗被浏览器拦截，请允许弹窗后重试')
  }
}

const startPaymentPolling = (orderId) => {
  stopPaymentPolling()
  paymentPollingTimer = setInterval(async () => {
    try {
      const res = await getPaymentStatus(orderId)
      if (res && res.payment_status === 'paid') {
        stopPaymentPolling()
        // 关闭支付宝弹窗（跨域，无法向其写入内容）
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close()
        }
        // 在主页面显示支付成功弹窗
        paymentSuccessOrderId.value = orderId
        showPaymentSuccessDialog.value = true
        // 刷新余额信息
        try {
          const balanceData = await getBillingBalance()
          if (balanceData) {
            credit.value = balanceData.credit || 0
            token.value = balanceData.token || 0
          }
        } catch (e) {
          console.error('Failed to refresh balance:', e)
        }
      }
    } catch (e) {
      console.error('Payment status polling error:', e)
    }
  }, 3000)
}

// 教程相关
const showTutorialDialog = ref(false)
const tutorialContent = ref('')
const tutorialLoading = ref(false)
const tutorialError = ref('')

const messages = ref([])
const inputMessage = ref('')
const selectedFiles = ref([])
const selectedFileUrls = ref([])
const messagesEndRef = ref(null)
const messagesListRef = ref(null)
const selectedResultFile = ref(null)
const isGenerating = ref(false)  // 用于标记是否正在生成
const chatAbortController = ref(null)  // 用于中断stream请求

const handleToolFileClick = (message) => {
  if (message.fileUrl) {
    handleResultFile({
      url: message.fileUrl,
      name: message.fileName,
      file_name: message.fileName
    })
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

// 刷新余额信息
const loadBalance = async () => {
  try {
    const balanceData = await getBillingBalance()
    if (balanceData) {
      credit.value = balanceData.credit || 0
      token.value = balanceData.token || 0
    }
  } catch (error) {
    console.error('Failed to fetch billing balance:', error)
  }
}

// 延迟刷新余额
const loadBalanceDelayed = async (delayMs = 2000) => {
  await new Promise(resolve => setTimeout(resolve, delayMs))
  await loadBalance()
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
      
      // 延迟2秒后刷新余额（给后端处理时间）
      loadBalanceDelayed(2000)
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
  } catch (error) {
    console.error('停止生成错误:', error)
    ElMessage.error('停止生成出现错误')
  } finally {
    isGenerating.value = false
    
    // 停止生成后也应用延迟刷新（应用时间可能也会有消费）
    loadBalanceDelayed(2000)
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
          if (textValue && textValue.file_attachment) {
            // 有file_attachment，支持单个URL或URL列表
            const fileAttachments = Array.isArray(textValue.file_attachment)
              ? textValue.file_attachment
              : [textValue.file_attachment]
            
            // 为每个file_attachment创建独立的消息
            fileAttachments.forEach(fileAttachment => {
              let fileUrl = fileAttachment
              if (typeof fileUrl === 'string') {
                fileUrl = fileUrl.trim().replace(/`/g, '')
              }
              const fileName = fileUrl.split('/').pop() || '文件'
              // 如果是图片文件，跳过（因为已经通过image_url展示过了）
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
            })
          } else {
            // 没有file_attachment，作为普通文本（跳过空文本，避免空气泡）
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
                if (contentData.file_attachment) {
                  const fileAttachments = Array.isArray(contentData.file_attachment)
                    ? contentData.file_attachment
                    : [contentData.file_attachment]
                  
                  // 支持单个URL或URL列表，返回多条独立消息
                  const toolMessages = fileAttachments.map((fileAttachment, idx) => {
                    let fileUrl = fileAttachment
                    if (typeof fileUrl === 'string') {
                      fileUrl = fileUrl.trim().replace(/`/g, '')
                    }
                    const fileName = fileUrl.split('/').pop() || '文件'
                    console.log('提取的 fileUrl:', fileUrl)
                    return {
                      id: index + idx,
                      type: 'tool',
                      fileName: fileName,
                      fileUrl: fileUrl,
                      timestamp: baseTimestamp
                    }
                  })
                  return toolMessages
                } else {
                  console.log('contentData 中没有 file_attachment 字段')
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
              
              // 步骤2: 当role为tool且有content时，处理file_attachment
              if (data.content) {
                try {
                  console.log('收到 tool 消息, content:', data.content)
                  const contentData = JSON.parse(data.content)
                  console.log('解析后的 contentData:', contentData)
                  if (contentData.file_attachment) {
                    const fileAttachments = Array.isArray(contentData.file_attachment) 
                      ? contentData.file_attachment 
                      : [contentData.file_attachment]
                    
                    // 遍历处理所有file_attachment（支持单个URL或URL列表）
                    fileAttachments.forEach((fileAttachment, index) => {
                      let fileUrl = fileAttachment
                      if (typeof fileUrl === 'string') {
                        fileUrl = fileUrl.trim().replace(/`/g, '')
                      }
                      console.log('提取的 fileUrl:', fileUrl)
                      const fileName = fileUrl.split('/').pop() || '文件'
                      
                      // 添加文件卡片消息（使用不同的ID避免重复）
                      toolMessageId = Date.now() + 2 + index
                      const toolMessage = {
                        id: toolMessageId,
                        type: 'tool',
                        fileName: fileName,
                        fileUrl: fileUrl,
                        timestamp: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      }
                      messages.value = [...messages.value, toolMessage]
                      handleResultFile({
                        url: fileUrl,
                        name: fileName,
                        file_name: fileName
                      })
                    })
                  } else {
                    console.log('contentData 中没有 file_attachment 字段')
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

    messages.value = messages.value.filter(msg => msg.type === 'tool' || msg.type === 'image' || (msg.content && msg.content.trim() !== ''))

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
    
    // AI一轮对话完成，延迟刷新余额（给后端处理时间）
    loadBalanceDelayed(2000)
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

const handleProfile = () => {
  router.push('/profile')
}

const handleSettings = () => {
  router.push('/settings')
}

const handleAssets = () => {
  router.push('/assets')
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
    ElMessage.success(t('message.logoutSuccess'))
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
    const lang = getLanguageCode(locale.value)
    const res = await queryAllAgentsInfo({ agent_name: name, language: lang })
    if (res && res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
      const agentData = res.data[0]
      agentNickName.value = agentData.nick_name || name
      agentAvatar.value = agentData.avatar || ''
      agentDescription.value = agentData.description || '我是你的AI助手，有什么可以帮到你的？'
      starterPrompts.value = agentData.starter_prompts || []
    }
  } catch (error) {
    console.error('Failed to fetch agent info:', error)
    agentNickName.value = name
    agentDescription.value = '我是你的AI助手，有什么可以帮到你的？'
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

  // 获取余额信息
  await loadBalance()
  
  // 获取公告信息
  await loadAnnouncements()
  
  fetchConversationHistory()
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

    // 重新获取余额信息
    try {
      const balanceData = await getBillingBalance()
      if (balanceData) {
        credit.value = balanceData.credit || 0
        token.value = balanceData.token || 0
      }
    } catch (error) {
      console.error('Failed to refresh billing balance:', error)
    }
  }
})

// 监听语言变化，重新加载公告（使用新的语言）
watch(() => locale.value, async (newLocale) => {
  const language = getLanguageCode(newLocale)
  await loadAnnouncements(language)
})

const handleStarterPromptClick = (prompt) => {
  inputMessage.value = prompt
  handleSendMessage()
}

// 处理打开教程
const handleOpenTutorial = async () => {
  showTutorialDialog.value = true
  tutorialLoading.value = true
  tutorialError.value = ''
  tutorialContent.value = ''

  try {
    const language = getLanguageCode(locale.value)
    const response = await fetchWithTokenRefresh(`/api/information/guidance?agent_name=${encodeURIComponent(agentName.value)}&language=${language}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.status === 'success' && data.data) {
      tutorialContent.value = data.data
    } else {
      tutorialError.value = data.detail || '无法加载教程内容'
    }
  } catch (error) {
    console.error('加载教程失败:', error)
    tutorialError.value = `加载教程失败: ${error.message}`
    ElMessage.error(tutorialError.value)
  } finally {
    tutorialLoading.value = false
  }
}

const getLanguageCode = (localeValue) => {
  return localeValue === 'zh-CN' ? 'zh' : 'en'
}

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toString()
}

const handleOpenRechargeDialog = async () => {
  showRechargeDialog.value = true
  selectedPackage.value = null
  customAmount.value = ''
  customPriceInfo.value = null
  
  if (packages.value.length === 0) {
    loadingPackages.value = true
    try {
      const data = await getPackages()
      if (data && Array.isArray(data)) {
        packages.value = data
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      ElMessage.error('获取套餐列表失败，请重试')
    } finally {
      loadingPackages.value = false
    }
  }
}

const getRechargeAmount = () => {
  if (selectedPackage.value) {
    const pkg = packages.value.find(p => p.name === selectedPackage.value)
    return pkg ? pkg.amount : 0
  }
  // 自定义金额时，使用接口返回的实际金额（可能应用了折扣）
  if (customPriceInfo.value) {
    return customPriceInfo.value.amount
  }
  return customAmount.value || 0
}

const getRechargeInfo = () => {
  if (selectedPackage.value) {
    const pkg = packages.value.find(p => p.name === selectedPackage.value)
    if (pkg) {
      return {
        credit: pkg.credit,
        token: pkg.token,
        // pkg.discount表示实际支付比例（1.0无折扣，0.98表示只需支付98%），所以折扣率应该是1-discount
        discount: 1 - pkg.discount
      }
    }
  } else if (customPriceInfo.value) {
    // 使用从接口获取的数据
    // discount_rate表示实际支付比例（1.0无折扣，0.98表示只需支付98%），所以折扣率应该是1-discount_rate
    return {
      credit: customPriceInfo.value.credit,
      token: customPriceInfo.value.token,
      discount: 1 - customPriceInfo.value.discount_rate
    }
  }
  return { credit: 0, token: 0, discount: 0 }
}

// 监听自定义金额输入，调用接口获取计算结果
watch(() => customAmount.value, async (newAmount) => {
  // 清除之前的定时器
  if (customPriceDebounceTimer) {
    clearTimeout(customPriceDebounceTimer)
  }
  
  // 如果没有输入或选择了套餐，清空缓存
  if (!newAmount || selectedPackage.value) {
    customPriceInfo.value = null
    return
  }

  const amount = parseFloat(newAmount)
  if (isNaN(amount) || amount <= 0) {
    customPriceInfo.value = null
    return
  }

  // 防抖：500ms后才发送请求
  customPriceDebounceTimer = setTimeout(async () => {
    try {
      customPriceLoading.value = true
      const result = await calculateCustomPrice(amount)
      if (result) {
        customPriceInfo.value = result
      }
    } catch (error) {
      console.error('Failed to calculate custom price:', error)
      customPriceInfo.value = null
    } finally {
      customPriceLoading.value = false
    }
  }, 500)
})

const handleRecharge = async () => {
  if (!selectedPackage.value && !customAmount.value) {
    ElMessage.error('请选择套餐或输入自定义金额')
    return
  }

  loadingRecharge.value = true
  try {
    const rechargeData = selectedPackage.value 
      ? { package_name: selectedPackage.value }
      : { custom_amount: parseFloat(customAmount.value) }

    const result = await recharge(rechargeData)
    
    if (result && result.html_content) {
      showRechargeDialog.value = false
      openPaymentWindow(result.html_content)
      startPaymentPolling(result.order_id)
    }
  } catch (error) {
    console.error('Recharge failed:', error)
    // 错误消息已由request拦截器处理，这里只需要记录日志
  } finally {
    loadingRecharge.value = false
  }
}
</script>

<style scoped lang="scss">
.agent-work-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f9fafb 100%);
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;

    .logo {
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      .logo-image {
        width: 150px;
        height: 100px;
        object-fit: contain;
      }

      .logo-text {
        margin-left: 8px;
        font-size: 18px;
        font-weight: 700;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .agent-title {
      display: flex;
      align-items: center;
      margin-left: 16px;

      .divider {
        color: #d9dce2;
        margin: 0 12px;
      }

      .agent-name {
        font-size: 16px;
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 24px;

    .balance-info {
      display: flex;
      gap: 20px;
      align-items: center;
      padding-right: 10px;
      border-right: 1px solid #e8e9eb;

      .balance-item {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;

        .balance-label {
          font-size: 12px;
          color: #909399;
          font-weight: 500;
        }

        .balance-value {
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .recharge-btn {
        padding: 8px 16px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f0f1f3;
      }

      .username {
        margin: 0 10px;
        font-size: 14px;
        color: #606266;
      }

      :deep(.el-icon) {
        color: #909399;
      }
    }
  }
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e8e9eb;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);

  .new-chat-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: calc(100% - 32px);
    margin: 20px 16px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }

    span:first-child {
      font-size: 18px;
    }
  }

  .conversation-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px 20px;

    .loading,
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;
      font-size: 14px;

      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
    }

    .conversation-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 14px 16px;
      margin-bottom: 10px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid #f0f0f0;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: linear-gradient(135deg, #f5f7ff 0%, #ecf5ff 100%);
        border-color: #e0e7ff;
        transform: translateX(4px);
      }

      &.active {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-color: #6366f1;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);

        .conversation-title {
          color: #fff;
        }

        .conversation-time {
          color: rgba(255, 255, 255, 0.8);
        }

        .menu-btn {
          color: rgba(255, 255, 255, 0.7);

          &:hover {
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }

      .conversation-info {
        flex: 1;
        overflow: hidden;

        .conversation-title {
          font-size: 15px;
          color: #333;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 6px;
        }

        .conversation-time {
          font-size: 12px;
          color: #999;
        }
      }

      .menu-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 16px;
        color: #999;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &:hover {
          background: #f5f5f5;
          color: #666;
        }
      }
    }

    .context-menu {
      position: absolute;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      border: 1px solid #e8e9eb;
      z-index: 100;
      padding: 6px 0;
      min-width: 120px;

      button {
        display: block;
        width: 100%;
        padding: 10px 16px;
        border: none;
        background: transparent;
        text-align: left;
        font-size: 14px;
        color: #ff4d4f;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;

        &:hover {
          background: #fff2f0;
          color: #cf1322;
        }
      }
    }
  }
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
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
  min-width: 0;
  background: #fff;
  border-right: 1px solid #e8e9eb;
}

.chat-right {
  width: 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  padding: 20px;
}

.result-render-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #e8e9eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  border-bottom: 1px solid #e8e9eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;

  .panel-icon {
    font-size: 16px;
  }
}

.panel-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.4;
  }

  .empty-text {
    font-size: 15px;
    color: #666;
  }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  height: 100%;
  min-height: 0;
}

.result-file-info {
  padding: 14px 20px;
  background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
  border: 1px solid #e8e9eb;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;

  .file-icon {
    font-size: 18px;
  }
}

.download-link {
  font-size: 14px;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
  padding: 6px 12px;
  background: #f0f7ff;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #e6f4ff;
    color: #3a8ee6;
  }
}

.download-btn,
.fallback-btn,
.preview-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  .download-icon {
    font-size: 16px;
  }
}

.fallback-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #ea6c6c 100%);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);

  &:hover {
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  }
}

.preview-action-btn {
  margin-top: 16px;
  background: linear-gradient(135deg, #409eff 0%, #66b0ff 100%);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);

  &:hover {
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e9eb;
  border-radius: 12px;
  padding: 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8e9eb;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #f56c6c;
  padding: 40px;
}

.error-icon {
  font-size: 48px;
}

.fallback-link,
.open-link {
  font-size: 14px;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
  margin-top: 12px;
  padding: 8px 16px;
  background: #f0f7ff;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #e6f4ff;
    color: #3a8ee6;
  }
}

.image-preview {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pdf-preview {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.html-preview {
  width: 100%;
  flex: 1;
  overflow: auto;
  min-height: 0;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
}

.html-iframe {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  display: block;
}

.text-preview {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.text-content {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #fafafa;
  border-radius: 8px;
  box-sizing: border-box;
}

.table-preview {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
  box-sizing: border-box;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.table-header-cell {
  padding: 12px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  font-weight: 600;
  border: 1px solid #ddd;
  text-align: left;
  white-space: nowrap;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
}

.table-row:hover {
  background: #f9f5ff;
}

.table-cell {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  color: #333;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.other-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #666;
}

.file-icon {
  font-size: 48px;
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;

  .welcome-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 32px;
      color: white;
    }
  }

  .welcome-title {
    font-size: 24px;
    color: #333;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .welcome-desc {
    font-size: 16px;
    color: #666;
    max-width: 500px;
    text-align: center;
    margin-bottom: 24px;
  }

  .tutorial-entry {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;

    .tutorial-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

      .tutorial-icon {
        font-size: 18px;
        transition: transform 0.3s ease;
      }

      .tutorial-text {
        letter-spacing: 0.5px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);

        .tutorial-icon {
          transform: scale(1.15) rotate(-5deg);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .starter-prompts {
    margin-bottom: 32px;

    .prompts-label {
      font-size: 14px;
      color: #999;
      margin-bottom: 12px;
    }

    .prompts-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;

      .prompt-item {
        padding: 8px 16px;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 20px;
        font-size: 14px;
        color: #409eff;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #f0f7ff;
          border-color: #409eff;
          color: #3a8ee6;
        }
      }
    }
  }

  .input-section {
    width: 100%;
    max-width: 700px;

    .selected-files-preview {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;

      .preview-title {
        font-size: 13px;
        color: #666;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .files-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .file-preview-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 13px;

          .file-icon {
            font-size: 16px;
            flex-shrink: 0;
          }

          .file-name {
            flex: 1;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .file-status {
            font-size: 12px;
            color: #6366f1;
            flex-shrink: 0;
          }

          .file-remove-btn {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            color: #999;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            flex-shrink: 0;

            &:hover {
              background: #fff3cd;
              border-color: #ffc107;
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
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            flex-shrink: 0;
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;

            .file-name {
              flex: 1;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12px;
            }

            .file-status {
              font-size: 11px;
              color: #6366f1;
              flex-shrink: 0;
            }

            .file-remove-btn {
              width: 20px;
              height: 20px;
              padding: 0;
              flex-shrink: 0;
            }
          }
        }
      }
    }

    .input-wrapper {
      position: relative;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e0e0e0;

      textarea {
        width: 100%;
        min-height: 120px;
        padding: 16px;
        padding-right: 100px;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        outline: none;
        resize: vertical;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .input-actions {
        position: absolute;
        bottom: 12px;
        right: 16px;
        display: flex;
        gap: 8px;

        .upload-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;

          &:hover {
            background: #f5f5f5;
          }
        }

        .send-btn {
          padding: 8px 20px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #5558e3;
          }

          &:disabled {
            background: #f0f0f0;
            color: #999;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .messages-list {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    .message-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      &.user {
        flex-direction: row-reverse;

        // 用户发送的文件卡片样式
        .tool-message-content {
          .file-card {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);

            .file-card-icon {
              color: white;
              font-size: 24px;
            }

            .file-card-info {
              .file-card-name {
                color: white;
              }

              .file-card-hint {
                color: rgba(255, 255, 255, 0.8);
              }
            }

            .file-card-action {
              color: white;
              opacity: 0.8;
            }

            &:hover {
              background: linear-gradient(135deg, #5558e3 0%, #7c4db8 100%);
              box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);

              .file-card-icon {
                color: white;
                transform: scale(1.1);
              }

              .file-card-action {
                opacity: 1;
              }
            }
          }
        }

        // 用户发送的图片样式
        .image-message-content {
          .message-image {
            border: 2px solid #6366f1;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
          }
        }
      }

      .message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
        overflow: hidden;
        
        &.has-image {
          background: #f0f0f0;
          padding: 0;
          
          .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }
      }

      .message-content {
        max-width: 70%;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .message-bubble {
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;

          &.user {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border-bottom-right-radius: 4px;
          }

          .message-text {
            font-family: inherit;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            padding: 0;
          }

          .attachments {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);

            .attachment-item {
              font-size: 12px;
              opacity: 0.9;
            }
          }
        }

        .ai-message-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;

          .typing {
            color: #999;
            font-style: italic;
          }

          .attachments {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e0e0e0;

            .attachment-item {
              font-size: 12px;
              color: #666;
            }
          }
        }

        .message-time {
          font-size: 12px;
          color: #999;
          padding: 0 4px;
        }

        .tool-message-content {
          min-width: 0;
          
          .file-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 18px;
            background: linear-gradient(135deg, #f8f9fc 0%, #ffffff 100%);
            border: 2px solid #e0e7ff;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 100%;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
            position: relative;
            overflow: hidden;

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              transition: all 0.5s;
            }

            &:hover {
              background: linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%);
              border-color: #6366f1;
              box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15);
              transform: translateY(-2px);

              .file-card-icon {
                transform: scale(1.15);
                color: #6366f1;
              }

              .file-card-action {
                opacity: 1;
                transform: translateX(4px);
              }

              &::before {
                left: 100%;
              }
            }

            &:active {
              transform: translateY(0);
            }

            .file-card-icon {
              font-size: 28px;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.25s;
            }

            .file-card-info {
              flex: 1;
              min-width: 0;
              display: flex;
              flex-direction: column;
              gap: 4px;

              .file-card-name {
                font-size: 15px;
                color: #333;
                font-weight: 600;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                letter-spacing: 0.3px;
              }

              .file-card-hint {
                font-size: 12px;
                color: #6366f1;
                font-weight: 500;
                opacity: 0.8;
              }
            }

            .file-card-action {
              font-size: 18px;
              font-weight: 600;
              color: #6366f1;
              flex-shrink: 0;
              opacity: 0.4;
              transition: all 0.25s;
            }
          }
        }

        .image-message-content {
          min-width: 0;
          max-width: 100%;
          
          .message-image {
            max-width: 300px;
            max-height: 300px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            display: block;
          }
        }

        .tool-calling-message {
          min-width: 0;
          width: 100%;
          
          .tool-calling-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
            border: 2px solid #fecaca;
            border-radius: 12px;
            font-size: 14px;
            color: #92400e;
            animation: slideIn 0.3s ease-out;

            .tool-calling-icon {
              font-size: 18px;
              flex-shrink: 0;
              animation: spin 2s linear infinite;
            }

            .tool-calling-text {
              flex: 1;
              font-weight: 500;
            }

            .tool-calling-spinner {
              display: flex;
              gap: 4px;
              align-items: center;
              flex-shrink: 0;

              .spinner-dot {
                width: 6px;
                height: 6px;
                background: #fca5a5;
                border-radius: 50%;
                animation: bounce 1.4s infinite;

                &:nth-child(2) {
                  animation-delay: 0.2s;
                }

                &:nth-child(3) {
                  animation-delay: 0.4s;
                }
              }
            }
          }
        }

        .tool-confirmation-message {
          min-width: 0;
          width: 100%;
          
          .tool-confirmation-content {
            padding: 16px;
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border: 2px solid #93c5fd;
            border-radius: 12px;
            animation: slideIn 0.3s ease-out;

            .confirmation-text {
              margin-bottom: 16px;
              font-size: 14px;
              color: #1e40af;
              line-height: 1.6;

              :deep(p) {
                margin: 0;
              }
            }

            .confirmation-buttons {
              display: flex;
              gap: 12px;
              justify-content: flex-end;

              .confirmation-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;

                &.allow-btn {
                  background: linear-gradient(135deg, #10b981, #059669);
                  color: white;
                  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

                  &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                  }

                  &:active {
                    transform: translateY(0);
                  }
                }

                &.deny-btn {
                  background: linear-gradient(135deg, #ef4444, #dc2626);
                  color: white;
                  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);

                  &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                  }

                  &:active {
                    transform: translateY(0);
                  }
                }
              }
            }
          }
        }
      }
    }

    .loading-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        flex-shrink: 0;
        overflow: hidden;
        
        &.has-image {
          background: #f0f0f0;
          padding: 0;
          
          .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
        }
      }

      .message-content {
        .ai-message-content {
          font-size: 14px;
          line-height: 1.6;
          color: #333;

          .typing {
            color: #999;
            font-style: italic;
          }
        }
      }
    }
  }

  .input-area {
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid #e0e0e0;

    .selected-files-preview {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;

      .preview-title {
        font-size: 13px;
        color: #666;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .files-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .file-preview-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 13px;

          .file-icon {
            font-size: 16px;
            flex-shrink: 0;
          }

          .file-name {
            flex: 1;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .file-status {
            font-size: 12px;
            color: #6366f1;
            flex-shrink: 0;
          }

          .file-remove-btn {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            color: #999;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            flex-shrink: 0;

            &:hover {
              background: #fff3cd;
              border-color: #ffc107;
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
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            flex-shrink: 0;
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;

            .file-name {
              flex: 1;
              color: #333;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12px;
            }

            .file-status {
              font-size: 11px;
              color: #6366f1;
              flex-shrink: 0;
            }

            .file-remove-btn {
              width: 20px;
              height: 20px;
              padding: 0;
              flex-shrink: 0;
            }
          }
        }
      }
    }

    .input-wrapper {
      position: relative;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e0e0e0;

      textarea {
        width: 100%;
        min-height: 80px;
        padding: 16px;
        padding-right: 100px;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        outline: none;
        resize: vertical;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .input-actions {
        position: absolute;
        bottom: 12px;
        right: 16px;
        display: flex;
        gap: 8px;

        .upload-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;

          &:hover {
            background: #f5f5f5;
          }
        }

        .send-btn {
          padding: 8px 20px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #5558e3;
          }

          &:disabled {
            background: #f0f0f0;
            color: #999;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}

// 动画定义
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    opacity: 0.6;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 充值对话框样式
.payment-success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 8px;
  text-align: center;

  .payment-success-icon {
    margin-bottom: 16px;
  }

  .payment-success-title {
    font-size: 24px;
    font-weight: 700;
    color: #15803d;
    margin-bottom: 12px;
  }

  .payment-success-order {
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  .payment-success-tip {
    font-size: 15px;
    color: #374151;
  }
}

.recharge-dialog-content {
  padding: 20px 0;

  .recharge-main {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    min-height: 320px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-left: 4px;
    }

    .packages-section {
      flex: 1;
      display: flex;
      flex-direction: column;

      .packages-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        flex: 1;
        overflow-y: auto;
        max-height: 300px;
        padding-right: 8px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 3px;

          &:hover {
            background: #bfbfbf;
          }
        }

        .package-card {
          padding: 12px;
          border: 2px solid #e8e9eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;

          &:hover {
            border-color: #6366f1;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
          }

          &.active {
            border-color: #6366f1;
            background: rgba(99, 102, 241, 0.08);
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);

            .package-amount {
              color: #6366f1;
            }
          }

          .package-amount {
            font-size: 16px;
            font-weight: 700;
            color: #303133;
            margin-bottom: 4px;
          }

          .package-description {
            font-size: 12px;
            color: #606266;
            margin-bottom: 6px;
          }

          .package-benefits {
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-bottom: 4px;

            .benefit {
              font-size: 11px;
              color: #909399;
            }
          }

          .package-discount {
            position: absolute;
            top: -1px;
            right: -1px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 3px 6px;
            border-radius: 0 6px;
            font-size: 11px;
            font-weight: 600;
          }
        }
      }
    }

    .divider-vertical {
      width: 1px;
      background: #e8e9eb;
      min-height: 300px;
    }

    .custom-section {
      flex: 1;
      display: flex;
      flex-direction: column;

      .custom-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;

        .custom-input-wrapper {
          position: relative;

          .custom-input {
            :deep(.el-input__wrapper) {
              background-color: #f5f6f7;

              &:hover {
                background-color: #fff;
              }
            }
          }

          .loading-text {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            color: #909399;
          }
        }

        .custom-preview {
          background: #f5f6f7;
          border-radius: 6px;
          padding: 12px;
          border-left: 3px solid #6366f1;
          flex: 1;
          overflow-y: auto;

          .preview-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 13px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              color: #606266;
              font-weight: 500;
            }

            .value {
              font-weight: 600;

              &.price {
                color: #303133;
                font-size: 14px;
              }

              &.discount {
                color: #67c23a;
              }

              &.benefit-text {
                color: #6366f1;
              }
            }
          }
        }
      }
    }
  }

  .price-preview {
    background: #f5f6f7;
    border-radius: 6px;
    padding: 12px;
    border-left: 3px solid #6366f1;
    margin-top: 16px;

    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      span:first-child {
        color: #606266;
        font-weight: 500;
      }

      .price {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }

      .discount {
        color: #67c23a;
        font-weight: 600;
      }

      .benefit-text {
        color: #6366f1;
        font-weight: 600;
      }
    }
  }
}

/* 悬浮公告面板样式 */
.announcement-float-btn {
  position: fixed;
  bottom: 120px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.3s;
  z-index: 99;
}

.announcement-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.announcement-float-btn:active {
  transform: scale(0.95);
}

.float-btn-icon {
  position: relative;
}

.float-btn-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4444;
  color: #fff;
  font-size: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 2px solid #fff;
}

.announcement-floating-panel {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 320px;
  max-height: 0;
  opacity: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.announcement-floating-panel.active {
  max-height: 500px;
  opacity: 1;
}

.announcement-panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  color: #1f2937;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  min-height: 0;
}

.no-announcement {
  padding: 40px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.loading-announcement {
  padding: 40px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.announcements-list {
  padding: 8px;
}

.announcement-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  position: relative;
}

.announcement-item:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.announcement-item.active {
  background-color: #f0f4ff;
  border-color: #6366f1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.item-type {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}

.item-type.type-maintenance {
  background-color: #fef3c7;
  color: #92400e;
}

.item-type.type-important {
  background-color: #fee2e2;
  color: #991b1b;
}

.item-type.type-feature {
  background-color: #d1fae5;
  color: #065f46;
}

.item-type.type-update {
  background-color: #dbeafe;
  color: #0c2d6b;
}

.item-badge {
  color: #6366f1;
  font-size: 12px;
  font-weight: 700;
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  line-height: 1.3;
}

.item-message {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-time {
  font-size: 11px;
  color: #9ca3af;
}

/* 滚动条样式 */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 教程对话框样式 */
.tutorial-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 24px;
    border-bottom: none;

    .el-dialog__title {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }

    .el-dialog__close {
      color: white;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background: #f9fafb;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
}

.tutorial-dialog-content {
  max-height: 600px;
  overflow-y: auto;

  .tutorial-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    gap: 16px;

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    span {
      color: #6b7280;
      font-size: 15px;
    }
  }

  .tutorial-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    gap: 16px;

    .error-icon {
      font-size: 48px;
    }

    .error-message {
      color: #dc2626;
      font-size: 14px;
      text-align: center;
      max-width: 400px;
      line-height: 1.6;
    }
  }

  .tutorial-content {
    background: white;
    border-radius: 8px;
    padding: 24px;
    line-height: 1.8;
    color: #333;

    :deep(h1) {
      font-size: 28px;
      font-weight: 700;
      margin: 24px 0 16px 0;
      color: #1f2937;
      border-bottom: 2px solid #667eea;
      padding-bottom: 12px;

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(h2) {
      font-size: 22px;
      font-weight: 600;
      margin: 20px 0 12px 0;
      color: #374151;
    }

    :deep(h3) {
      font-size: 18px;
      font-weight: 600;
      margin: 16px 0 8px 0;
      color: #4b5563;
    }

    :deep(p) {
      margin: 8px 0;
      font-size: 14px;
    }

    :deep(pre) {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 16px;
      overflow-x: auto;
      margin: 12px 0;

      code {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        color: #1f2937;
      }
    }

    :deep(code) {
      background: #f0f1f3;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #dc2626;
    }

    :deep(ul),
    :deep(ol) {
      margin: 12px 0;
      padding-left: 24px;

      li {
        margin: 6px 0;
      }
    }

    :deep(blockquote) {
      border-left: 4px solid #667eea;
      background: #f0f4ff;
      padding: 12px 16px;
      margin: 12px 0;
      border-radius: 4px;
      color: #555;
    }

    :deep(a) {
      color: #667eea;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
        color: #764ba2;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 12px 0;
      border: 1px solid #e5e7eb;
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      border: 1px solid #e5e7eb;

      th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px;
        text-align: left;
        font-weight: 600;
      }

      td {
        border: 1px solid #e5e7eb;
        padding: 12px;
      }

      tr:hover {
        background: #f9fafb;
      }
    }
  }
}

/* 滚动条样式 */
.tutorial-dialog-content::-webkit-scrollbar {
  width: 8px;
}

.tutorial-dialog-content::-webkit-scrollbar-track {
  background: transparent;
}

.tutorial-dialog-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.tutorial-dialog-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
