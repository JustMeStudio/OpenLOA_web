<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>{{ t('common.settings') }}</span>
          <el-button v-if="!isEditing" type="primary" @click="startEdit">
            <el-icon><Edit /></el-icon>
            {{ t('common.edit') }}
          </el-button>
          <div v-else class="edit-buttons">
            <el-button @click="cancelEdit">{{ t('common.cancel') }}</el-button>
            <el-button type="primary" :loading="saving" @click="saveEdit">
              {{ t('common.save') }}
            </el-button>
          </div>
        </div>
      </template>
      <div v-loading="loading" class="settings-content">
        <div v-if="error" class="error-message">
          <el-alert :title="error" type="error" show-icon />
          <el-button style="margin-top: 20px;" type="primary" @click="loadSettings">
            {{ t('common.submit') }}
          </el-button>
        </div>
        <div v-else class="settings-info">
          <el-form v-if="isEditing" :model="editableSettings" label-position="top" class="settings-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('common.languagePref')">
                  <el-select v-model="editableSettings.language_pref" :placeholder="t('common.pleaseSelect')">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('common.timezone')">
                  <el-input v-model="editableSettings.timezone" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <el-descriptions v-else :column="2" border class="settings-details">
            <el-descriptions-item :label="t('common.email')">
              <div class="setting-item">
                <span>{{ settings.email || '-' }}</span>
                <el-tag v-if="settings.email_verified" type="success" size="small">
                  {{ t('common.verified') }}
                </el-tag>
                <el-tag v-else type="info" size="small">
                  {{ t('common.notVerified') }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.phoneNumber')">
              <div class="setting-item">
                <span>{{ settings.phone_number || '-' }}</span>
                <el-tag v-if="settings.phone_number_verified" type="success" size="small">
                  {{ t('common.verified') }}
                </el-tag>
                <el-tag v-else type="info" size="small">
                  {{ t('common.notVerified') }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.languagePref')">
              {{ settings.language_pref || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.timezone')">
              {{ settings.timezone || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.userRole')">
              {{ settings.user_role || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.subscribeHistory')">
              {{ settings.subscribe_history || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.createTime')">
              {{ formatTime(settings.create_time) }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.lastLoginTime')">
              {{ formatTime(settings.last_login_time) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { getSettings, updateUserInfo } from '@/api/auth'

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const isEditing = ref(false)
const settings = ref({})
const editableSettings = reactive({})

const formatTime = (time) => {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch (e) {
    return time
  }
}

const loadSettings = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getSettings()
    settings.value = res
    Object.assign(editableSettings, res)
  } catch (err) {
    console.error('Failed to load settings:', err)
    error.value = t('message.loadSettingsFailed')
    ElMessage.error(t('message.loadSettingsFailed'))
  } finally {
    loading.value = false
  }
}

const startEdit = () => {
  Object.assign(editableSettings, settings.value)
  isEditing.value = true
}

const cancelEdit = () => {
  Object.assign(editableSettings, settings.value)
  isEditing.value = false
}

const saveEdit = async () => {
  saving.value = true
  try {
    const updateData = {}
    
    if (editableSettings.language_pref !== settings.value.language_pref) {
      updateData.language_pref = editableSettings.language_pref
    }
    if (editableSettings.timezone !== settings.value.timezone) {
      updateData.timezone = editableSettings.timezone
    }
    
    if (Object.keys(updateData).length === 0) {
      ElMessage.warning(t('common.nothingToUpdate'))
      isEditing.value = false
      return
    }
    
    await updateUserInfo(updateData)
    ElMessage.success(t('common.updateSuccess'))
    
    settings.value = { ...settings.value, ...updateData }
    isEditing.value = false
  } catch (err) {
    console.error('Failed to update settings:', err)
    if (err.response?.data?.detail === 'Nothing to update') {
      ElMessage.warning(t('common.nothingToUpdate'))
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.settings-page {
  width: 100%;
  padding: 20px;
}

.settings-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.edit-buttons {
  display: flex;
  gap: 10px;
}

.settings-content {
  min-height: 300px;
}

.error-message {
  text-align: center;
  padding: 40px;
}

.settings-info {
  padding: 20px 0;
}

.settings-details {
  :deep(.el-descriptions__label) {
    font-weight: 600;
    width: 150px;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-form {
  max-width: 700px;
  margin: 0 auto;
}
</style>
