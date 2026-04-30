<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>{{ t('common.profile') }}</span>
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
      <div v-loading="loading" class="profile-content">
        <div v-if="error" class="error-message">
          <el-alert :title="error" type="error" show-icon />
          <el-button style="margin-top: 20px;" type="primary" @click="loadProfile">
            {{ t('common.submit') }}
          </el-button>
        </div>
        <div v-else class="profile-info">
          <div class="profile-avatar-section">
            <div class="avatar-wrapper">
              <el-avatar :size="120" :src="editableProfile.avatar_url" icon="UserFilled" />
              <div v-if="isEditing" class="avatar-overlay" @click="triggerAvatarUpload">
                <el-icon :size="40"><Camera /></el-icon>
                <span>{{ t('common.uploadAvatar') }}</span>
              </div>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarSelect"
            />
          </div>
          <el-form v-if="isEditing" :model="editableProfile" label-position="top" class="profile-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('common.nickname')">
                  <el-input v-model="editableProfile.nick_name" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('common.gender')">
                  <el-select v-model="editableProfile.gender" :placeholder="t('common.pleaseSelect')">
                    <el-option :label="t('common.male')" value="male" />
                    <el-option :label="t('common.female')" value="female" />
                    <el-option :label="t('common.other')" value="other" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="t('common.country')">
                  <el-select
                    v-model="editableProfile.country"
                    :placeholder="t('common.pleaseSelect')"
                    filterable
                    clearable
                  >
                    <el-option
                      v-for="country in sortedCountries"
                      :key="country.code"
                      :label="locale === 'zh-CN' ? country.nameZh : country.name"
                      :value="country.name"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('common.title')">
                  <el-input v-model="editableProfile.title" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item :label="t('common.bio')">
              <el-input
                v-model="editableProfile.bio"
                type="textarea"
                :rows="4"
              />
            </el-form-item>
          </el-form>
          <el-descriptions v-else :column="2" border class="profile-details">
            <el-descriptions-item :label="t('common.nickname')">
              {{ profile.nick_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.title')">
              {{ profile.title || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.gender')">
              {{ formatGender(profile.gender) }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.country')">
              {{ displayCountryName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.experience')">
              {{ profile.experience || 0 }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.credit')">
              {{ profile.credit || 0 }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.bio')" :span="2">
              {{ profile.bio || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>

    <!-- 头像编辑对话框 -->
    <el-dialog
      v-model="showAvatarEditor"
      title="编辑头像"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="avatar-editor-content">
        <div v-if="previewImage" class="editor-preview">
          <div class="source-section">
            <span class="section-label">原始图片</span>
            <img
              ref="sourceImageRef"
              :src="previewImage"
              alt="编辑中的头像"
              class="source-image"
              @load="handleImageLoad"
            />
          </div>
          <div class="preview-section">
            <span class="section-label">圆形预览</span>
            <div class="preview-circle">
              <div class="circle-border">
                <canvas ref="circleCanvasRef" class="circle-canvas"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">加载图片中...</div>
        
        <div v-if="previewImage" class="editor-controls">
          <div class="zoom-control">
            <span>缩放:</span>
            <el-slider
              v-model="avatarScale"
              :min="50"
              :max="200"
              :step="10"
              show-input
              @input="drawCirclePreview"
            />
          </div>
          <div class="position-control">
            <span>{{ t('common.adjust') }}:</span>
            <div class="position-buttons">
              <el-button @click="moveImage(-10, 0)" icon="ArrowLeft" circle />
              <el-button @click="moveImage(10, 0)" icon="ArrowRight" circle />
              <el-button @click="moveImage(0, -10)" icon="ArrowUp" circle />
              <el-button @click="moveImage(0, 10)" icon="ArrowDown" circle />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelAvatarEdit">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="confirmAvatarEdit">
            确认并上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Edit, Camera } from '@element-plus/icons-vue'
import { getProfile, updateUserInfo, getPresignedUrl } from '@/api/auth'
import { getSortedCountries, getCountryName } from '@/utils/countries'
import { compressAvatarImage } from '@/utils/imageCompress'
import { useUserStore } from '@/stores/user'

const { t, locale } = useI18n()
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const isEditing = ref(false)
const profile = ref({})
const editableProfile = reactive({})
const avatarInputRef = ref(null)
const userStore = useUserStore()

// 头像编辑相关
const showAvatarEditor = ref(false)
const previewImage = ref('')
const sourceImageRef = ref(null)
const circleCanvasRef = ref(null)
const avatarScale = ref(100)
const avatarOffsetX = ref(0)
const avatarOffsetY = ref(0)
const selectedFile = ref(null)

const sortedCountries = computed(() => getSortedCountries(locale.value))

const displayCountryName = computed(() => {
  return getCountryName(profile.value.country, locale.value)
})

const formatGender = (gender) => {
  if (!gender) return '-'
  if (gender.toLowerCase() === 'male') return t('common.male')
  if (gender.toLowerCase() === 'female') return t('common.female')
  return t('common.other')
}

const loadProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getProfile()
    profile.value = res
    Object.assign(editableProfile, res)
  } catch (err) {
    console.error('Failed to load profile:', err)
    error.value = t('message.loadProfileFailed')
    ElMessage.error(t('message.loadProfileFailed'))
  } finally {
    loading.value = false
  }
}

const startEdit = () => {
  Object.assign(editableProfile, profile.value)
  isEditing.value = true
}

const cancelEdit = () => {
  Object.assign(editableProfile, profile.value)
  isEditing.value = false
}

const saveEdit = async () => {
  saving.value = true
  try {
    const updateData = {}
    
    if (editableProfile.nick_name !== profile.value.nick_name) {
      updateData.nick_name = editableProfile.nick_name
    }
    if (editableProfile.avatar_url !== profile.value.avatar_url) {
      updateData.avatar_url = editableProfile.avatar_url
    }
    if (editableProfile.bio !== profile.value.bio) {
      updateData.bio = editableProfile.bio
    }
    if (editableProfile.country !== profile.value.country) {
      updateData.country = editableProfile.country
    }
    if (editableProfile.gender !== profile.value.gender) {
      updateData.gender = editableProfile.gender
    }
    
    if (Object.keys(updateData).length === 0) {
      ElMessage.warning(t('common.nothingToUpdate'))
      isEditing.value = false
      return
    }
    
    await updateUserInfo(updateData)
    ElMessage.success(t('common.updateSuccess'))
    
    // 更新本地状态
    profile.value = { ...profile.value, ...updateData }
    
    // 关键：更新Pinia store中的用户信息
    userStore.updateUserInfo(updateData)
    
    isEditing.value = false
  } catch (err) {
    console.error('Failed to update profile:', err)
    if (err.response?.data?.detail === 'Nothing to update') {
      ElMessage.warning(t('common.nothingToUpdate'))
    }
  } finally {
    saving.value = false
  }
}

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click()
}

const handleAvatarSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  selectedFile.value = file
  
  // 读取图片文件并显示编辑对话框
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
    avatarScale.value = 100
    avatarOffsetX.value = 0
    avatarOffsetY.value = 0
    showAvatarEditor.value = true
    
    // 等待图片加载和对话框渲染
    nextTick(() => {
      drawCirclePreview()
    })
  }
  reader.readAsDataURL(file)
}

const handleImageLoad = () => {
  drawCirclePreview()
}

const drawCirclePreview = () => {
  if (!sourceImageRef.value || !circleCanvasRef.value) return
  
  const canvas = circleCanvasRef.value
  const ctx = canvas.getContext('2d')
  const img = sourceImageRef.value
  
  // 设置canvas大小
  const size = 200
  canvas.width = size
  canvas.height = size
  
  // 清空canvas
  ctx.clearRect(0, 0, size, size)
  
  // 绘制圆形框
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  
  // 计算缩放后的尺寸
  const scaledWidth = img.width * (avatarScale.value / 100)
  const scaledHeight = img.height * (avatarScale.value / 100)
  
  // 计算居中位置
  const x = (size - scaledWidth) / 2 + avatarOffsetX.value
  const y = (size - scaledHeight) / 2 + avatarOffsetY.value
  
  // 绘制图片
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
}

const moveImage = (dx, dy) => {
  avatarOffsetX.value += dx
  avatarOffsetY.value += dy
  drawCirclePreview()
}

const canvasToBlob = async (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
}

const confirmAvatarEdit = async () => {
  if (!circleCanvasRef.value || !selectedFile.value) {
    ElMessage.error('图片处理失败，请重试')
    return
  }
  
  uploading.value = true
  try {
    // 从canvas获取圆形头像数据
    const croppedBlob = await canvasToBlob(circleCanvasRef.value)
    let croppedFile = new File([croppedBlob], selectedFile.value.name, { type: 'image/png' })
    
    // 压缩头像到50KB以下
    console.log('[头像编辑] 开始压缩头像...')
    try {
      croppedFile = await compressAvatarImage(croppedFile)
      console.log('[头像编辑] 头像压缩完成，大小: ' + (croppedFile.size / 1024).toFixed(2) + 'KB')
    } catch (error) {
      console.error('[头像编辑] 头像压缩失败，使用原文件:', error)
      ElMessage.warning('头像压缩失败，将使用原文件上传')
    }
    
    console.log('[头像编辑] 获取presigned URL...')
    
    // 1. 获取 presigned URL
    const presignedRes = await getPresignedUrl({
      file_name: croppedFile.name,
      file_size: croppedFile.size,
      content_type: croppedFile.type || 'image/jpeg',
      mode: 'avatar'
    })
    
    if (presignedRes.status !== 'success' || !presignedRes.data) {
      const errorMessage = presignedRes.detail || presignedRes.message || '获取上传链接失败'
      console.error('[头像编辑] 获取presigned URL失败:', errorMessage)
      throw new Error(errorMessage)
    }
    
    const { upload_url, oss_key, access_key_id, policy, signature, static_url } = presignedRes.data
    
    console.log('[头像编辑] 上传文件到OSS...')
    
    // 2. 上传文件到OSS
    const formData = new FormData()
    formData.append('key', oss_key)
    formData.append('policy', policy)
    formData.append('OSSAccessKeyId', access_key_id)
    formData.append('signature', signature)
    formData.append('Content-Type', croppedFile.type || 'image/jpeg')
    formData.append('file', croppedFile)
    
    const uploadResponse = await fetch(upload_url, {
      method: 'POST',
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error(`OSS上传失败: ${uploadResponse.status}`)
    }
    
    console.log('[头像编辑] 更新个人资料...')
    
    // 3. 更新用户头像信息到后端
    await updateUserInfo({
      avatar_url: static_url
    })
    
    // 4. 更新本地状态和Pinia store
    editableProfile.avatar_url = static_url
    profile.value.avatar_url = static_url
    
    // 关键：同步更新Pinia store中的用户信息
    userStore.updateUserInfo({
      avatar_url: static_url
    })
    
    ElMessage.success('头像上传成功')
    showAvatarEditor.value = false
    previewImage.value = ''
    selectedFile.value = null
  } catch (err) {
    console.error('[头像编辑] 失败:', err)
    // request.js 的拦截器已经自动显示错误信息（如文件过大等）
    // 这里只需记录错误日志即可
  } finally {
    uploading.value = false
    if (avatarInputRef.value) {
      avatarInputRef.value.value = ''
    }
  }
}

const cancelAvatarEdit = () => {
  showAvatarEditor.value = false
  previewImage.value = ''
  selectedFile.value = null
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped lang="scss">
.profile-page {
  width: 100%;
  padding: 20px;
}

.profile-card {
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

.profile-content {
  min-height: 300px;
}

.error-message {
  text-align: center;
  padding: 40px;
}

.profile-info {
  padding: 20px 0;
}

.profile-avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  
  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
    
    span {
      margin-top: 8px;
      font-size: 12px;
    }
    
    &:hover {
      opacity: 1;
    }
  }
}

.profile-details {
  :deep(.el-descriptions__label) {
    font-weight: 600;
    width: 150px;
  }
}

.profile-form {
  max-width: 700px;
  margin: 0 auto;
}

/* 头像编辑对话框样式 */
.avatar-editor-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-preview {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  
  .source-section,
  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .section-label {
    font-size: 12px;
    color: #909399;
    font-weight: 500;
  }
  
  .source-image {
    max-width: 300px;
    max-height: 300px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .preview-circle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    
    .circle-border {
      width: 200px;
      height: 200px;
      border: 2px solid #f0f0f0;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      
      .circle-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    }
    
    .preview-label {
      font-size: 12px;
      color: #909399;
      margin-top: 8px;
    }
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  color: #909399;
}

.editor-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  
  .zoom-control,
  .position-control {
    display: flex;
    align-items: center;
    gap: 12px;
    
    > span {
      min-width: 60px;
      font-size: 14px;
      font-weight: 500;
    }
  }
  
  .zoom-control {
    :deep(.el-slider) {
      flex: 1;
    }
  }
  
  .position-buttons {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    
    :deep(.el-button) {
      margin: 0;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
}

@media (max-width: 768px) {
  .editor-preview {
    flex-direction: column;
    gap: 20px;
    
    .source-image {
      max-width: 250px;
      max-height: 250px;
    }
  }
  
  .position-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
