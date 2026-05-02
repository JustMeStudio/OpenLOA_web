<template>
  <div>
    <!-- 登录表单 -->
    <el-form v-if="!showReset" :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
      <el-form-item label="账户" prop="account">
        <el-input
          v-model="loginForm.account"
          placeholder="账户"
          size="large"
          prefix-icon="User"
        />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="密码"
          size="large"
          prefix-icon="Lock"
          show-password
        />
        <div style="text-align: right; margin-top: 8px;">
          <el-link type="primary" :underline="false" @click="showReset = true">
            忘记密码
          </el-link>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 重置密码表单 -->
    <el-form v-else :model="resetForm" :rules="resetRules" ref="resetFormRef" label-position="top">
      <div class="reset-header">
        <el-button type="primary" plain size="small" @click="showReset = false" class="back-button">
          <template #icon>
            <span>←</span>
          </template>
          返回登录
        </el-button>
      </div>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="resetForm.email"
          placeholder="邮箱"
          size="large"
          prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item label="验证码" prop="email_code">
        <div class="verify-code-wrapper">
          <el-input
            v-model="resetForm.email_code"
            placeholder="验证码"
            size="large"
            prefix-icon="Key"
          />
          <el-button
            type="primary"
            size="large"
            :disabled="resetCountdown > 0"
            @click="handleSendResetCode"
            style="width: 140px; margin-left: 10px;"
          >
            {{ resetCountdown > 0 ? `${resetCountdown}秒后重新发送` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="新密码" prop="new_password">
        <el-input
          v-model="resetForm.new_password"
          type="password"
          placeholder="新密码"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirm_new_password">
        <el-input
          v-model="resetForm.confirm_new_password"
          type="password"
          placeholder="确认密码"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleResetPassword">
          重置密码
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, sendCode, resetPassword } from '@/api/auth'
const router = useRouter()
const loginFormRef = ref(null)
const resetFormRef = ref(null)
const loading = ref(false)
const showReset = ref(false)
const resetCountdown = ref(0)

const emit = defineEmits(['login-success'])

const loginForm = ref({
  account: '',
  password: ''
})

const resetForm = ref({
  email: '',
  email_code: '',
  new_password: '',
  confirm_new_password: ''
})

const validateAccount = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入账户'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!value) {
    callback(new Error('请输入邮箱'))
  } else if (!emailReg.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetForm.value.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const loginRules = {
  account: [{ validator: validateAccount, trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const resetRules = {
  email: [{ validator: validateEmail, trigger: 'blur' }],
  email_code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirm_new_password: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await login(loginForm.value)
        localStorage.setItem('access_token', res.access_token)
        localStorage.setItem('refresh_token', res.refresh_token)
        localStorage.setItem('token_type', res.token_type)
        localStorage.setItem('nick_name', res.nick_name || '')
        ElMessage.success('登录成功')
        emit('login-success')
      } catch (error) {
        console.error(error)
        if (error.response?.status === 401) {
          ElMessage.error('账户或密码错误')
        } else {
          ElMessage.error('网络错误')
        }
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSendResetCode = async () => {
  try {
    await sendCode({
      target: resetForm.value.email,
      mode: 'email',
      purpose: 'reset'
    })
    ElMessage.success('验证码已发送')
    
    resetCountdown.value = 60
    const timer = setInterval(() => {
      resetCountdown.value--
      if (resetCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  }
}

const handleResetPassword = async () => {
  await resetFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await resetPassword({
          email: resetForm.value.email,
          email_code: resetForm.value.email_code,
          new_password: resetForm.value.new_password,
          confirm_new_password: resetForm.value.confirm_new_password
        })
        
        ElMessage.success('密码重置成功')
        // 重置表单并返回登录
        showReset.value = false
        resetForm.value = {
          email: '',
          email_code: '',
          new_password: '',
          confirm_new_password: ''
        }
      } catch (error) {
        console.error(error)
        const detail = error.response?.data?.detail
        if (detail && detail.toLowerCase().includes('passwords do not match')) {
          ElMessage.error('两次输入的密码不一致')
        } else if (detail && detail.toLowerCase().includes('invalid email verification code')) {
          ElMessage.error('验证码不正确')
        } else if (detail && detail.toLowerCase().includes('email not registered')) {
          ElMessage.error('邮箱未注册')
        } else {
          ElMessage.error('网络错误')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.verify-code-wrapper {
  display: flex;
  width: 100%;
}

.reset-header {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  
  .back-button {
    width: 100%;
    justify-content: flex-start;
    font-size: 14px;
    height: 32px;
    
    &:hover {
      background-color: rgba(64, 158, 255, 0.1) !important;
    }
  }
}
</style>
