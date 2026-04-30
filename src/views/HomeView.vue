<template>
  <div class="home-page">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-container">
            <img src="/logo.png" alt="OpenLOA" class="logo-image" />
          </div>
        </div>
        <div class="header-right">
          <div class="language-switcher">
            <el-select v-model="currentLocale" @change="changeLanguage" style="width: 120px">
              <el-option label="中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </div>
          <div class="auth-buttons">
            <template v-if="!isLoggedIn">
              <el-button type="text" @click="openLoginDialog">{{ t('common.login') }}</el-button>
              <el-button type="primary" @click="openRegisterDialog">{{ t('common.register') }}</el-button>
            </template>
            <template v-else>
              <div class="user-info-wrapper">
                <span class="user-name">{{ userName }}</span>
                <el-button type="text" @click="handleLogout">{{ t('common.logout') }}</el-button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">{{ t('common.heroTitle') }}</h1>
          <p class="hero-subtitle">{{ t('common.heroSubtitle') }}</p>
          <div class="search-box">
            <div class="task-input-wrapper">
              <el-input 
                v-model="taskRequirement" 
                :placeholder="t('common.taskPlaceholder')"
                type="textarea"
                :rows="4"
                class="task-input"
              />
              <el-button 
                type="primary" 
                size="large"
                class="recommend-btn"
                :loading="isLoading"
                @click="handleRecommend"
              >
                {{ t('common.getRecommend') || 'Get Recommend' }}
              </el-button>
            </div>
            <div v-if="recommendReason" class="recommend-feedback">
              <p class="feedback-label">{{ t('common.recommendation') || 'Recommendation' }}:</p>
              <p class="feedback-text">{{ recommendReason }}</p>
            </div>
            <div v-if="recommendError" class="recommend-error">
              {{ recommendError }}
            </div>
          </div>
        </div>
      </section>

      <section class="agents-section">
        <div class="agents-container">
          <div class="filter-bar" v-if="categories.length > 0">
            <span class="filter-label">{{ t('common.categories') }}:</span>
            <el-radio-group v-model="selectedCategory" size="large">
              <el-radio-button :value="''">{{ t('common.allAgents') }}</el-radio-button>
              <el-radio-button 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </el-radio-button>
            </el-radio-group>
          </div>

          <div class="agents-grid">
            <div 
              v-for="agent in filteredAgents" 
              :key="agent.id" 
              class="agent-card"
              :class="{ 'is-recommended': recommendedAgentNames.includes(agent.name) }"
              @click="handleAgentClick(agent)"
            >
              <div class="agent-image">
                <img :src="agent.image" :alt="agent.nick_name" />
                <div v-if="recommendedAgentNames.includes(agent.name)" class="recommended-badge">
                  {{ t('common.recommended') || 'Recommended' }}
                </div>
              </div>
              <div class="agent-info">
                <h3 class="agent-name">{{ agent.nick_name }}</h3>
                <p class="agent-description">{{ agent.description }}</p>
                <div class="agent-tags">
                  <el-tag v-for="tag in agent.tags" :key="tag" size="small" type="info">
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="#">{{ t('common.footerAbout') }}</a>
          <a href="#">{{ t('common.footerContact') }}</a>
          <a href="#">{{ t('common.footerPrivacy') }}</a>
          <a href="#">{{ t('common.footerTerms') }}</a>
        </div>
        <p class="copyright">© 2024 {{ t('common.appName') }}. All rights reserved.</p>
      </div>
    </footer>

    <el-dialog
      v-model="loginDialogVisible"
      :title="t('common.login')"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <LoginForm @login-success="handleLoginSuccess" />
    </el-dialog>

    <el-dialog
      v-model="registerDialogVisible"
      :title="t('common.register')"
      width="450px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <RegisterForm @register-success="handleRegisterSuccess" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import { queryAllAgentsInfo, recommendAgents } from '@/api/agent'

const { t, locale } = useI18n()
const router = useRouter()

const loginDialogVisible = ref(false)
const registerDialogVisible = ref(false)
const currentLocale = ref(locale.value)
const searchQuery = ref('')
const taskRequirement = ref('')
const selectedCategory = ref('')
const pendingAgent = ref(null)
const isLoading = ref(false)
const recommendReason = ref('')
const recommendError = ref('')
const recommendedAgentNames = ref([])

const categories = ref([])
const agents = ref([])

const getLanguageCode = (localeValue) => {
  return localeValue === 'zh-CN' ? 'zh' : 'en'
}

const fetchAgents = async () => {
  try {
    const lang = getLanguageCode(locale.value)
    const res = await queryAllAgentsInfo({ language: lang })
    if (res && res.success && res.data) {
      agents.value = res.data.map((item, index) => ({
        id: index + 1,
        name: item.name,
        nick_name: item.nick_name,
        description: item.description,
        tags: item.tags || [],
        categoryId: item.type || '',
        image: item.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20agent%20intelligent%20assistant%20avatar&image_size=square_hd'
      }))
      
      const uniqueCategories = [...new Set(res.data.map(item => item.type).filter(Boolean))]
      categories.value = uniqueCategories.map((cat, index) => ({ id: cat, name: cat }))
    }
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }
}

watch(locale, () => {
  fetchAgents()
})

const isLoggedIn = computed(() => !!localStorage.getItem('access_token'))
const userName = computed(() => localStorage.getItem('nick_name') || '用户')

const filteredAgents = computed(() => {
  let result = agents.value
  
  // 如果有推荐的 agents，在"全部"分类中显示时，推荐的 agents 排在最前
  if (selectedCategory.value === '' && recommendedAgentNames.value.length > 0) {
    const recommended = agents.value.filter(agent => 
      recommendedAgentNames.value.includes(agent.name)
    )
    const others = agents.value.filter(agent => 
      !recommendedAgentNames.value.includes(agent.name)
    )
    result = [...recommended, ...others]
  } else if (selectedCategory.value) {
    result = result.filter(agent => agent.categoryId === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(agent => 
      (agent.nick_name && agent.nick_name.toLowerCase().includes(query)) || 
      (agent.description && agent.description.toLowerCase().includes(query)) ||
      agent.tags.some(tag => tag && tag.toLowerCase().includes(query))
    )
  }
  return result
})

onMounted(() => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    locale.value = savedLocale
    currentLocale.value = savedLocale
  }
  fetchAgents()
})

const changeLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
  localStorage.setItem('locale', lang)
}

const handleSearch = () => {
}

const handleRecommend = async () => {
  if (!taskRequirement.value.trim()) {
    ElMessage.warning(t('message.pleaseInputTask') || 'Please input task requirement')
    return
  }

  if (!isLoggedIn.value) {
    ElMessage.warning(t('message.pleaseLogin') || 'Please login first')
    loginDialogVisible.value = true
    return
  }

  isLoading.value = true
  recommendError.value = ''
  
  try {
    const accessToken = localStorage.getItem('access_token')
    const res = await recommendAgents({
      requirement: taskRequirement.value
    })
    
    if (res && res.status === 'success' && res.data) {
      recommendReason.value = res.data.reason || ''
      recommendedAgentNames.value = res.data.recommended_agents || []
      selectedCategory.value = '' // 切换到"全部"分类显示推荐的 agents
      ElMessage.success(t('message.recommendSuccess') || 'Recommendation successful')
    } else {
      recommendError.value = res?.detail || t('message.recommendFailed') || 'Recommendation failed'
      recommendedAgentNames.value = []
      recommendReason.value = ''
    }
  } catch (error) {
    console.error('Recommend agents error:', error)
    recommendError.value = error.message || t('message.recommendError') || 'An error occurred'
    recommendedAgentNames.value = []
    recommendReason.value = ''
  } finally {
    isLoading.value = false
  }
}

const handleAgentClick = (agent) => {
  if (isLoggedIn.value) {
    navigateToAgent(agent)
  } else {
    pendingAgent.value = agent
    loginDialogVisible.value = true
  }
}

const navigateToAgent = (agent) => {
  router.push({
    path: '/agent',
    query: {
      name: agent.name
    }
  })
}

const openLoginDialog = () => {
  loginDialogVisible.value = true
}

const openRegisterDialog = () => {
  registerDialogVisible.value = true
}

const handleLoginSuccess = () => {
  loginDialogVisible.value = false
  if (pendingAgent.value) {
    navigateToAgent(pendingAgent.value)
    pendingAgent.value = null
  } else {
    window.location.reload()
  }
}

const handleRegisterSuccess = () => {
  registerDialogVisible.value = false
  window.location.reload()
}

const handleDialogClosed = () => {
  pendingAgent.value = null
}

const handleLogout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_type')
  localStorage.removeItem('nick_name')
  ElMessage.success(t('message.logoutSuccess'))
  setTimeout(() => {
    window.location.reload()
  }, 500)
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f23;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(15, 15, 35, 0.95);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  z-index: 1000;
  padding: 0 20px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  .logo-container {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: transform 0.3s ease, filter 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    .logo-image {
      width: 150px;
      height: 100px;
      object-fit: contain;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 700;
      background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
      position: relative;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, #c4b5fd, transparent);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }

      &:hover::after {
        transform: scaleX(1);
      }
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;

  .user-info-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-name {
    color: #c4b5fd;
    font-weight: 500;
  }

  :deep(.el-button) {
    border: 1px solid #8b5cf6;
    background: #8b5cf6;
    color: #ffffff;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      background: #7c3aed;
      border-color: #7c3aed;
      color: #ffffff;
    }

    &.el-button--text {
      border: none;
      background: transparent;
      color: #a78bfa;

      &:hover {
        background: rgba(139, 92, 246, 0.1);
        color: #c4b5fd;
      }
    }
  }
}

.main-content {
  flex: 1;
  margin-top: 64px;
}

.hero-section {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: url('https://cdn.OpenLOA.com/web/homepage/banner.jpg') center/cover no-repeat;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 15, 35, 0.6) 0%,
    rgba(30, 27, 75, 0.5) 50%,
    rgba(15, 15, 35, 0.6) 100%
  );
  pointer-events: none;
}

.hero-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #ffffff;
  padding: 80px 20px;
  max-width: 900px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background: linear-gradient(135deg, #ffffff 0%, #f0e7ff 50%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.3rem;
  margin-bottom: 40px;
  opacity: 0.95;
  line-height: 1.6;
  color: #e9d5ff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.search-box {
  max-width: 700px;
  margin: 0 auto;

  .task-input-wrapper {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .task-input {
      flex: 1;

      :deep(.el-textarea__wrapper) {
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid rgba(139, 92, 246, 0.5);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 12px;
        transition: all 0.3s ease;

        &:hover {
          border-color: #8b5cf6;
          box-shadow: 0 8px 40px rgba(139, 92, 246, 0.3);
        }

        &.is-focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3), 0 8px 40px rgba(139, 92, 246, 0.4);
        }
      }

      :deep(.el-textarea__inner) {
        color: #1e1b4b;
        font-weight: 400;
        font-size: 14px;
        line-height: 1.5;
        resize: none;

        &::placeholder {
          color: #a8a2d1;
          opacity: 0.5;
        }

        &:focus {
          outline: none;
        }
      }
    }

    .recommend-btn {
      margin-top: 34px;
      white-space: nowrap;
      height: 40px;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 6px;
      background: #8b5cf6;
      border-color: #8b5cf6;
      transition: all 0.3s ease;

      &:hover {
        background: #7c3aed;
        border-color: #7c3aed;
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
      }

      &:active {
        background: #6d28d9;
        border-color: #6d28d9;
      }

      &.is-loading {
        opacity: 0.8;
      }
    }
  }

  .recommend-feedback {
    margin-top: 16px;
    padding: 12px 16px;
    background: rgba(139, 92, 246, 0.1);
    border-left: 4px solid #8b5cf6;
    border-radius: 4px;
    animation: slideIn 0.3s ease;

    .feedback-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #c4b5fd;
      margin-bottom: 4px;
    }

    .feedback-text {
      font-size: 0.95rem;
      color: #a5b4fc;
      line-height: 1.6;
      margin: 0;
    }
  }

  .recommend-error {
    margin-top: 12px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #ef4444;
    border-radius: 4px;
    color: #fca5a5;
    font-size: 0.95rem;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.agents-section {
  padding: 60px 20px;
  background: #0f0f23;
  position: relative;
}

.agents-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
}

.agents-container {
  max-width: 1400px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;

  .filter-label {
    color: #c4b5fd;
    font-weight: 600;
    font-size: 1.1rem;
  }

  :deep(.el-radio-button__inner) {
    background: rgba(30, 27, 75, 0.8);
    border-color: rgba(139, 92, 246, 0.3);
    color: #a5b4fc;

    &:hover {
      color: #c4b5fd;
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: #8b5cf6;
    border-color: #8b5cf6;
    color: #ffffff;
  }
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
}

.agent-card {
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 15, 35, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &.is-recommended {
    border-color: rgba(139, 92, 246, 0.6);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
  }

  .agent-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 10%;
      transition: transform 0.3s ease;
    }

    .recommended-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #a78bfa, #c084fc);
      color: white;
      padding: 8px 16px;
      border-radius: 24px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 8px 20px rgba(139, 92, 246, 0.4);
      animation: badgePulse 2s ease-in-out infinite, badgeIn 0.3s ease;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  }

  &:hover .agent-image img {
    transform: scale(1.05);
  }

  @keyframes badgeIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateX(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateX(0);
    }
  }

  @keyframes badgePulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 8px 20px rgba(139, 92, 246, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 30px rgba(139, 92, 246, 1), 0 8px 30px rgba(139, 92, 246, 0.6);
      transform: scale(1.05);
    }
  }

  .agent-info {
    padding: 24px;

    .agent-name {
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .agent-category {
      font-size: 0.9rem;
      color: #8b5cf6;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .agent-description {
      font-size: 0.95rem;
      color: #a5b4fc;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .agent-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-tag) {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        color: #c4b5fd;
      }
    }
  }
}

.footer {
  background: #0a0a1a;
  color: #818cf8;
  padding: 40px 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;

  a {
    color: #818cf8;
    text-decoration: none;
    transition: color 0.3s ease;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
      transition: width 0.3s ease;
    }

    &:hover {
      color: #c4b5fd;

      &::after {
        width: 100%;
      }
    }
  }
}

.copyright {
  color: #6366f1;
  font-size: 0.9rem;
}

:deep(.el-dialog) {
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(15, 15, 35, 0.99) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);

  .el-dialog__header {
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  }

  .el-dialog__title {
    background: linear-gradient(135deg, #ffffff 0%, #c4b5fd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .el-dialog__close {
    color: #818cf8;

    &:hover {
      color: #c4b5fd;
    }
  }

  .el-dialog__body {
    color: #c4b5fd;
  }

  .el-form-item__label {
    color: #a5b4fc;
  }

  .el-input__wrapper {
    background-color: rgba(30, 27, 75, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.3);
    box-shadow: none;

    &:hover {
      background-color: rgba(30, 27, 75, 0.9);
      border-color: rgba(139, 92, 246, 0.5);
    }

    &.is-focus {
      background-color: rgba(30, 27, 75, 0.95);
      border-color: #8b5cf6;
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
    }
  }

  .el-input__inner {
    color: #ffffff;
    &::placeholder {
      color: #818cf8;
    }
  }

  .el-input__prefix {
    color: #a78bfa;
  }

  .el-button--primary {
    background-color: #8b5cf6;
    border-color: #8b5cf6;
    color: #ffffff;
    font-weight: 600;

    &:hover {
      background-color: #7c3aed;
      border-color: #7c3aed;
      color: #ffffff;
    }

    &:active {
      background-color: #6d28d9;
      border-color: #6d28d9;
      color: #ffffff;
    }

    &.is-disabled {
      background-color: #4c1d95;
      border-color: #4c1d95;
      color: #818cf8;
    }
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 0;
  }

  .logo {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 10px;

    .logo-container {
      .logo-image {
        width: 70px;
        height: 70px;
        object-fit: contain;
      }

      .logo-text {
        font-size: 22px;
      }
    }
  }

  .header-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .filter-bar {
    justify-content: center;
  }

  .agents-grid {
    grid-template-columns: 1fr;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 20px;
  }
}
</style>
