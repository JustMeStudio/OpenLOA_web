<template>
  <div>
    <div class="register-type-label">
      <span class="register-type-icon">✉</span>
      {{ t('common.emailRegister') }}
    </div>

    <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-position="top">
      <el-form-item :label="t('common.email')" prop="email">
        <el-input
          v-model="registerForm.email"
          :placeholder="t('common.email')"
          size="large"
          prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item :label="t('common.verifyCode')" prop="email_code">
        <div class="verify-code-wrapper">
          <el-input
            v-model="registerForm.email_code"
            :placeholder="t('common.verifyCode')"
            size="large"
            prefix-icon="Key"
          />
          <el-button
            type="primary"
            size="large"
            :disabled="countdown > 0"
            @click="handleSendCode"
            style="width: 140px; margin-left: 10px;"
          >
            {{ countdown > 0 ? `${countdown}${t('common.resendCode')}` : t('common.sendCode') }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item :label="t('common.password')" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          :placeholder="t('common.password')"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item :label="t('common.confirmPassword')" prop="confirm_password">
        <el-input
          v-model="registerForm.confirm_password"
          type="password"
          :placeholder="t('common.confirmPassword')"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleRegister">
          {{ t('common.register') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { sendCode, register, login } from '@/api/auth'

const { t, locale } = useI18n()
const emit = defineEmits(['register-success'])
const registerFormRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
const registerType = ref('email')

const registerForm = ref({
  email: '',
  email_code: '',
  password: '',
  confirm_password: ''
})

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (e) {
    return 'UTC'
  }
}

const getLanguagePref = () => {
  return locale.value
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
  if (value !== registerForm.value.password) {
    callback(new Error(t('validation.passwordMismatch')))
  } else {
    callback()
  }
}

const registerRules = {
  email: [{ validator: validateEmail, trigger: 'blur' }],
  email_code: [
    { required: true, message: t('validation.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('validation.verifyCodeLength'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('validation.passwordMinLength'), trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: t('validation.confirmPasswordRequired'), trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getErrorMessage = (error) => {
  const detail = error.response?.data?.detail
  
  if (detail) {
    const detailLower = detail.toLowerCase()
    if (detailLower.includes('passwords do not match')) {
      return t('message.passwordsDoNotMatch')
    }
    if (detailLower.includes('invalid email verification code')) {
      return t('message.invalidVerifyCode')
    }
    if (detailLower.includes('account already exists')) {
      return t('message.accountAlreadyExists')
    }
  }
  
  if (error.response?.status === 409) {
    return t('message.emailAlreadyExists')
  } else if (error.response?.status === 400) {
    return t('message.invalidVerifyCode')
  } else if (error.response?.status === 401) {
    return t('message.invalidCredentials')
  } else {
    return t('message.registerFailed')
  }
}

const handleSendCode = async () => {
  try {
    await sendCode({
      target: registerForm.value.email,
      mode: 'email',
      purpose: 'register'
    })
    ElMessage.success(t('message.sendCodeSuccess'))
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error(error)
    const detail = error.response?.data?.detail
    if (detail && detail.toLowerCase().includes('account already exists')) {
      ElMessage.error(t('message.accountAlreadyExists'))
    } else if (error.response?.status === 409) {
      ElMessage.error(t('message.emailAlreadyExists'))
    } else {
      ElMessage.error(t('message.networkError'))
    }
  }
}

const handleRegister = async () => {
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const registerData = {
          email: registerForm.value.email,
          email_code: registerForm.value.email_code,
          password: registerForm.value.password,
          confirm_password: registerForm.value.confirm_password,
          timezone: getTimezone(),
          language_pref: getLanguagePref()
        }
        
        await register(registerData)
        
        const loginData = {
          account: registerForm.value.email,
          password: registerForm.value.password
        }
        
        const loginRes = await login(loginData)
        localStorage.setItem('access_token', loginRes.access_token)
        localStorage.setItem('refresh_token', loginRes.refresh_token)
        localStorage.setItem('token_type', loginRes.token_type)
        localStorage.setItem('nick_name', loginRes.nick_name || '')
        
        ElMessage.success(t('message.registerSuccess'))
        emit('register-success')
      } catch (error) {
        console.error(error)
        ElMessage.error(getErrorMessage(error))
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

.register-type-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px 0;
  font-size: 14px;
  color: #909399;
  border-bottom: 1px solid #f0f0f0;

  .register-type-icon {
    font-size: 15px;
    opacity: 0.7;
  }
}
</style>
