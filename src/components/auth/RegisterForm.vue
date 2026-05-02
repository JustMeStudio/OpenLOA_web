<template>
  <div>
    <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-position="top">
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="registerForm.email"
          placeholder="邮箱"
          size="large"
          prefix-icon="Message"
        />
      </el-form-item>

      <el-form-item label="验证码" prop="email_code">
        <div class="verify-code-wrapper">
          <el-input
            v-model="registerForm.email_code"
            placeholder="验证码"
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
            {{ countdown > 0 ? `${countdown}秒后重新发送` : '发送验证码' }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="密码"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirm_password">
        <el-input
          v-model="registerForm.confirm_password"
          type="password"
          placeholder="确认密码"
          size="large"
          prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { sendCode, register, login } from '@/api/auth'
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
    callback(new Error('请输入邮箱'))
  } else if (!emailReg.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  email: [{ validator: validateEmail, trigger: 'blur' }],
  email_code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getErrorMessage = (error) => {
  const detail = error.response?.data?.detail
  
  if (detail) {
    const detailLower = detail.toLowerCase()
    if (detailLower.includes('passwords do not match')) {
      return '两次输入的密码不一致'
    }
    if (detailLower.includes('invalid email verification code')) {
      return '验证码不正确'
    }
    if (detailLower.includes('account already exists')) {
      return '账户已存在'
    }
  }
  
  if (error.response?.status === 409) {
    return '邮箱已注册'
  } else if (error.response?.status === 400) {
    return '验证码不正确'
  } else if (error.response?.status === 401) {
    return '账户或密码错误'
  } else {
    return '注册失败'
  }
}

const handleSendCode = async () => {
  try {
    await sendCode({
      target: registerForm.value.email,
      mode: 'email',
      purpose: 'register'
    })
    ElMessage.success('验证码已发送')
    
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
      ElMessage.error('账户已存在')
    } else if (error.response?.status === 409) {
      ElMessage.error('邮箱已注册')
    } else {
      ElMessage.error('网络错误')
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
          language_pref: 'zh'
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
        
        ElMessage.success('注册成功')
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
</style>
