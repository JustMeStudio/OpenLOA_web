<template>
  <div>
    <!-- 登录表单 -->
    <el-form v-if="!showReset" :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
      <el-form-item :label="t('common.account')" prop="account">
        <el-input
          v-model="loginForm.account"
          :placeholder="t('common.account')"
          size="large"
          prefix-icon="User"
        />
      </el-form-item>
      <el-form-item :label="t('common.password')" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          :placeholder="t('common.password')"
          size="large"
          prefix-icon="Lock"
          show-password
        />
        <div style="text-align: right; margin-top: 8px;">
          <el-link type="primary" :underline="false" @click="showReset = true">
            {{ t('common.forgotPassword') }}
          </el-link>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleLogin">
          {{ t('common.login') }}
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
          {{ t('common.backToLogin') }}
        </el-button>
      </div>

      <el-form-item :label="t('common.email')" prop="email">
        <el-input
          v-model="resetForm.email"
          :placeholder="t('common.email')"
          size="large"
          prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item :label="t('common.verifyCode')" prop="email_code">
        <div class="verify-code-wrapper">
          <el-input
            v-model="resetForm.email_code"
            :placeholder="t('common.verifyCode')"
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
            {{ resetCountdown > 0 ? `${resetCountdown}${t('common.resendCode')}` : t('common.sendCode') }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item :label="t('common.newPassword')" prop="new_password">
        <el-input
          v-model="resetForm.new_password"
          type="password"
          :placeholder="t('common.newPassword')"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item :label="t('common.confirmPassword')" prop="confirm_new_password">
        <el-input
          v-model="resetForm.confirm_new_password"
          type="password"
          :placeholder="t('common.confirmPassword')"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleResetPassword">
          {{ t('common.resetPassword') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, sendCode, resetPassword } from '@/api/auth'

const { t } = useI18n()
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
    callback(new Error(t('validation.accountRequired')))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  const emailReg = /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
  if (!value) {
    callback(new Error(t('validation.emailRequired')))
  } else if (!emailReg.test(value)) {
    callback(new Error(t('validation.emailInvalid')))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetForm.value.new_password) {
    callback(new Error(t('validation.passwordMismatch')))
  } else {
    callback()
  }
}

const loginRules = {
  account: [{ validator: validateAccount, trigger: 'blur' }],
  password: [
    { required: true, message: t('validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ]
}

const resetRules = {
  email: [{ validator: validateEmail, trigger: 'blur' }],
  email_code: [
    { required: true, message: t('validation.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('validation.verifyCodeLength'), trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: t('validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ],
  confirm_new_password: [
    { required: true, message: t('validation.confirmPasswordRequired'), trigger: 'blur' },
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
        ElMessage.success(t('message.loginSuccess'))
        emit('login-success')
      } catch (error) {
        console.error(error)
        if (error.response?.status === 401) {
          ElMessage.error(t('message.invalidCredentials'))
        } else {
          ElMessage.error(t('message.networkError'))
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
    ElMessage.success(t('message.sendCodeSuccess'))
    
    resetCountdown.value = 60
    const timer = setInterval(() => {
      resetCountdown.value--
      if (resetCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error(error)
    ElMessage.error(t('message.networkError'))
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
        
        ElMessage.success(t('message.resetPasswordSuccess'))
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
          ElMessage.error(t('message.passwordsDoNotMatch'))
        } else if (detail && detail.toLowerCase().includes('invalid email verification code')) {
          ElMessage.error(t('message.invalidVerifyCode'))
        } else if (detail && detail.toLowerCase().includes('email not registered')) {
          ElMessage.error(t('message.emailNotRegistered'))
        } else {
          ElMessage.error(t('message.networkError'))
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
