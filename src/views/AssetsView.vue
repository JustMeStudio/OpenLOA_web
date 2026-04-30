<template>
  <div class="assets-page">
    <el-card class="assets-card">
      <template #header>
        <div class="card-header">
          <span>{{ t('common.assets') }}</span>
        </div>
      </template>
      <div v-loading="loading" class="assets-content">
        <div v-if="error" class="error-message">
          <el-alert :title="error" type="error" show-icon />
          <el-button style="margin-top: 20px;" type="primary" @click="loadAssets">
            {{ t('common.submit') }}
          </el-button>
        </div>
        <div v-else class="assets-info">
          <el-row :gutter="20" class="assets-cards">
            <el-col :xs="24" :sm="12" :md="6">
              <el-card class="asset-item-card" shadow="hover">
                <div class="asset-icon credit-icon">
                  <el-icon :size="40"><Money /></el-icon>
                </div>
                <div class="asset-value">{{ assets.credit || 0 }}</div>
                <div class="asset-label">{{ t('common.credit') }}</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card class="asset-item-card" shadow="hover">
                <div class="asset-icon experience-icon">
                  <el-icon :size="40"><Trophy /></el-icon>
                </div>
                <div class="asset-value">{{ assets.experience || 0 }}</div>
                <div class="asset-label">{{ t('common.experience') }}</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card class="asset-item-card" shadow="hover">
                <div class="asset-icon title-icon">
                  <el-icon :size="40"><Medal /></el-icon>
                </div>
                <div class="asset-value">{{ assets.title || '-' }}</div>
                <div class="asset-label">{{ t('common.title') }}</div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <el-card class="asset-item-card" shadow="hover">
                <div class="asset-icon role-icon">
                  <el-icon :size="40"><User /></el-icon>
                </div>
                <div class="asset-value">{{ assets.user_role || '-' }}</div>
                <div class="asset-label">{{ t('common.userRole') }}</div>
              </el-card>
            </el-col>
          </el-row>
          <el-card class="subscribe-card" style="margin-top: 20px;">
            <div class="subscribe-label">{{ t('common.subscribeHistory') }}</div>
            <div class="subscribe-value">{{ assets.subscribe_history || '-' }}</div>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Money, Trophy, Medal, User } from '@element-plus/icons-vue'
import { getAssets } from '@/api/auth'

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const assets = ref({})

const loadAssets = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getAssets()
    assets.value = res
  } catch (err) {
    console.error('Failed to load assets:', err)
    error.value = t('message.loadAssetsFailed')
    ElMessage.error(t('message.loadAssetsFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAssets()
})
</script>

<style scoped lang="scss">
.assets-page {
  width: 100%;
  padding: 20px;
}

.assets-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.assets-content {
  min-height: 200px;
}

.error-message {
  text-align: center;
  padding: 40px;
}

.assets-info {
  padding: 20px 0;
}

.assets-cards {
  margin-bottom: 20px;
}

.asset-item-card {
  text-align: center;
  margin-bottom: 20px;
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
}

.asset-icon {
  margin-bottom: 15px;
  
  &.credit-icon {
    color: #f59e0b;
  }
  
  &.experience-icon {
    color: #10b981;
  }
  
  &.title-icon {
    color: #8b5cf6;
  }
  
  &.role-icon {
    color: #3b82f6;
  }
}

.asset-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.asset-label {
  font-size: 14px;
  color: #909399;
}

.subscribe-card {
  .subscribe-label {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .subscribe-value {
    font-size: 16px;
    color: #303133;
  }
}
</style>
