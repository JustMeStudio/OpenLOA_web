<template>
  <div class="home-page">
    <header class="header">
      <div class="header-content">
        <div class="logo">
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
      <section class="agents-section">
        <div class="agents-container">
          <div class="filter-bar" v-if="categories.length > 0">
            <span class="filter-label">分类:</span>
            <el-radio-group v-model="selectedCategory" size="large">
              <el-radio-button :value="''">全部Agent</el-radio-button>
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
              @click="handleAgentClick(agent)"
            >
              <div class="agent-image">
                <img :src="agent.image" :alt="agent.nick_name" />
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

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryAllAgentsInfo } from '@/api/agent'
const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('')
const pendingAgent = ref(null)

const categories = ref([])
const agents = ref([])

const fetchAgents = async () => {
  try {
    const res = await queryAllAgentsInfo({ language: 'zh' })
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

watch(() => {}, () => {
  fetchAgents()
})

const isLoggedIn = computed(() => !!localStorage.getItem('access_token'))
const userName = computed(() => localStorage.getItem('nick_name') || '鐢ㄦ埛')

const filteredAgents = computed(() => {
  let result = agents.value
  
  // 濡傛灉鏈夋帹鑽愮殑 agents锛屽湪"鍏ㄩ儴"鍒嗙被涓樉绀烘椂锛屾帹鑽愮殑 agents 鎺掑湪鏈€鍓?
  if (selectedCategory.value) {
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
  fetchAgents()
})

const handleAgentClick = (agent) => {
  navigateToAgent(agent)
}

const navigateToAgent = (agent) => {
  router.push({
    path: '/agent',
    query: {
      name: agent.name
    }
  })
}

const handleGoLogin = () => {
  router.push('/auth')
}

const handleLogout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_type')
  localStorage.removeItem('nick_name')
  ElMessage.success('已退出登录')
  router.push('/auth')
}
</script>

<style scoped lang="scss">
// ── Design tokens ─────────────────────────────────────────────────────────
// Primary: indigo-violet palette, light background
$primary: #6366f1;
$primary-dark: #4f46e5;
$text: #111827;
$text-muted: #6b7280;
$bg: #f8f9fb;
$card-bg: #ffffff;
$border: #e5e7eb;

// ── Page shell ─────────────────────────────────────────────────────────────
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg;
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

.logo .logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  .logo-image { width: 192px; height: 192px; object-fit: contain; }
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

// ── Main ───────────────────────────────────────────────────────────────────
.main-content {
  flex: 1;
  margin-top: 60px;
}

// ── Agents section ─────────────────────────────────────────────────────────
.agents-section {
  padding: 40px 24px 60px;
  background: $bg;
}

.agents-container {
  max-width: 1400px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fb 0%, #f5f6ff 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;

  .filter-label {
    color: $text;
    font-weight: 600;
    font-size: 0.95rem;
    min-width: 60px;
  }

  :deep(.el-radio-button__wrapper) {
    margin: 0 !important;
  }

  :deep(.el-radio-button__inner) {
    border-radius: 20px !important;
    border: 1px solid $border;
    color: $text-muted;
    background: #fff;
    padding: 8px 16px !important;
    font-weight: 500;
    transition: all 0.2s;
    &:hover { 
      color: $primary;
      border-color: $primary;
      background: rgba(99,102,241,0.05);
    }
  }
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: $primary;
    border-color: $primary;
    color: #fff;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  :deep(.el-radio-button:first-child .el-radio-button__inner) { border-left: 1px solid $border; }
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 16px;
}

// ── Agent card ─────────────────────────────────────────────────────────────
.agent-card {
  background: $card-bg;
  border: 1px solid $border;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  display: flex;
  align-items: stretch;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    border-color: rgba(99,102,241,0.35);
  }

  .agent-image {
    width: 140px;
    min-width: 140px;
    height: auto;
    min-height: 140px;
    overflow: hidden;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.3s;
    }
  }

  &:hover .agent-image img { transform: scale(1.08); }

  .agent-info {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .agent-name {
    font-size: 1rem;
    font-weight: 600;
    color: $text;
    margin: 0 0 4px;
  }

  .agent-description {
    font-size: 0.85rem;
    color: $text-muted;
    line-height: 1.5;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .agent-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: auto;

    :deep(.el-tag) {
      background: #eef2ff;
      border-color: #c7d2fe;
      color: $primary;
      font-size: 0.75rem;
      border-radius: 4px;
    }
  }
}
</style>