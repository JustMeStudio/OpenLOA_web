<template>
  <div class="landing-page">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-container">
            <svg class="wave-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#b0b0b0;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#808080;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#e0e0e0;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#a0a0a0;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#logoGrad)" opacity="0.15"/>
          <path d="M8 20 L14 20" stroke="url(#logoGrad2)" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M14 20 L14 10 Q17 7 20 10 L20 30 Q23 33 26 30 L26 14" stroke="url(#logoGrad2)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M26 14 L32 14" stroke="url(#logoGrad2)" stroke-width="2.5" stroke-linecap="round"/>
          <circle class="pulse-dot" cx="8" cy="20" r="3" fill="url(#logoGrad2)"/>
            </svg>
            <span class="logo-text">OpenLOA</span>
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
            <el-button type="text" @click="openLoginDialog">{{ t('common.login') }}</el-button>
            <el-button type="primary" @click="openRegisterDialog">{{ t('common.register') }}</el-button>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <section class="hero-section">
        <div class="hero-background"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{ t('common.heroTitle') }}</h1>
          <p class="hero-subtitle">{{ t('common.heroSubtitle') }}</p>
          <div class="hero-buttons">
            <el-button type="primary" size="large" @click="openRegisterDialog">{{ t('common.getStarted') }}</el-button>
            <el-button size="large" @click="scrollToFeatures">{{ t('common.learnMore') }}</el-button>
          </div>
        </div>
      </section>

      <section class="features-section" id="features">
        <div class="features-container">
          <h2 class="section-title">{{ t('common.slogan') }}</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <img :src="feature1Image" alt="Smart Learning" />
              </div>
              <h3 class="feature-title">{{ t('common.feature1Title') }}</h3>
              <p class="feature-desc">{{ t('common.feature1Desc') }}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <img :src="feature2Image" alt="Rich Courses" />
              </div>
              <h3 class="feature-title">{{ t('common.feature2Title') }}</h3>
              <p class="feature-desc">{{ t('common.feature2Desc') }}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <img :src="feature3Image" alt="Real-time Practice" />
              </div>
              <h3 class="feature-title">{{ t('common.feature3Title') }}</h3>
              <p class="feature-desc">{{ t('common.feature3Desc') }}</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">
                <img :src="feature4Image" alt="Community Interaction" />
              </div>
              <h3 class="feature-title">{{ t('common.feature4Title') }}</h3>
              <p class="feature-desc">{{ t('common.feature4Desc') }}</p>
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
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

const { t, locale } = useI18n()
const router = useRouter()
const loginDialogVisible = ref(false)
const registerDialogVisible = ref(false)
const currentLocale = ref(locale.value)

const feature1Image = computed(() => 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20artificial%20intelligence%20music%20learning%20dashboard%20analytics%20interface&image_size=square_hd')
const feature2Image = computed(() => 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20courses%20piano%20guitar%20lessons%20education%20classroom&image_size=square_hd')
const feature3Image = computed(() => 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=real%20time%20music%20practice%20feedback%20instruments%20technology&image_size=square_hd')
const feature4Image = computed(() => 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20community%20people%20playing%20together%20collaboration&image_size=square_hd')

onMounted(() => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    locale.value = savedLocale
    currentLocale.value = savedLocale
  }
})

const changeLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
  localStorage.setItem('locale', lang)
}

const openLoginDialog = () => {
  loginDialogVisible.value = true
}

const openRegisterDialog = () => {
  registerDialogVisible.value = true
}

const scrollToFeatures = () => {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
}

const handleRegisterSuccess = () => {
  registerDialogVisible.value = false
  router.push('/')
}

const handleLoginSuccess = () => {
  loginDialogVisible.value = false
  router.push('/')
}
}
</script>

<style scoped lang="scss">
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #121212;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(18, 18, 18, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  padding: 0 20px;
}

.header-content {
  max-width: 1200px;
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

    .wave-icon {
      width: 40px;
      height: 40px;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #a0a0a0 100%);
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
        background: linear-gradient(90deg, transparent, #ffffff, #e0e0e0, #a0a0a0, transparent);
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

  :deep(.el-button) {
    border: 1px solid #ffffff;
    background: #ffffff;
    color: #121212;
    font-weight: 600;
    transition: all 0.3s ease;
    width: 100px;

    &:hover {
      background: #e0e0e0;
      border-color: #e0e0e0;
      color: #121212;
    }

    &.el-button--text {
      border: 1px solid #ffffff;
      background: #ffffff;
      color: #121212;

      &:hover {
        background: #e0e0e0;
        border-color: #e0e0e0;
        color: #121212;
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
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(180deg, rgba(18, 18, 18, 0.7) 0%, rgba(18, 18, 18, 0.9) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #ffffff;
  padding: 40px 20px;
  max-width: 800px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #a0a0a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.4rem;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
  color: #a0aec0;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;

  :deep(.el-button) {
    border: 2px solid transparent;
    background: #ffffff;
    color: #121212;
    font-weight: 600;
    padding: 15px 40px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      background: #e0e0e0;
    }

    &.el-button--default {
      background: transparent;
      border: 2px solid #ffffff;
      color: #ffffff;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.features-section {
  padding: 80px 20px;
  background: linear-gradient(180deg, #1e1e1e 0%, #121212 100%);
  position: relative;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 60px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.feature-card {
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(18, 18, 18, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.feature-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #e0e0e0 0%, #b0b0b0 50%, #808080 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.feature-desc {
  font-size: 1rem;
  color: #a0aec0;
  line-height: 1.6;
}

.footer {
  background: #0a0a0a;
  color: #a0a0a0;
  padding: 40px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;

  a {
    color: #a0a0a0;
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
      background: linear-gradient(90deg, #ffffff, #e0e0e0);
      transition: width 0.3s ease;
    }

    &:hover {
      color: #ffffff;

      &::after {
        width: 100%;
      }
    }
  }
}

.copyright {
  color: #718096;
  font-size: 0.9rem;
}

:deep(.el-dialog) {
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(18, 18, 18, 0.99) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);

  .el-dialog__header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-dialog__title {
    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .el-dialog__close {
    color: #a0a0a0;

    &:hover {
      color: #ffffff;
    }
  }

  .el-dialog__body {
    color: #e0e0e0;
  }

  .el-form-item__label {
    color: #d0d0d0;
  }

  .el-input__wrapper {
    background-color: rgba(40, 40, 40, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;

    &:hover {
      background-color: rgba(50, 50, 50, 0.9);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.is-focus {
      background-color: rgba(45, 45, 45, 0.95);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
    }
  }

  .el-input__inner {
    color: #ffffff;
    &::placeholder {
      color: #808080;
    }
  }

  .el-input__prefix {
    color: #b0b0b0;
  }

  .el-button--primary {
    background-color: #ffffff;
    border-color: #ffffff;
    color: #121212;
    font-weight: 600;

    &:hover {
      background-color: #e0e0e0;
      border-color: #e0e0e0;
      color: #121212;
    }

    &:active {
      background-color: #c0c0c0;
      border-color: #c0c0c0;
      color: #121212;
    }

    &.is-disabled {
      background-color: #606060;
      border-color: #606060;
      color: #a0a0a0;
    }
  }

  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background-color: #ffffff;
    border-color: #ffffff;
    color: #121212;
  }

  .el-radio-button__inner {
    background-color: rgba(40, 40, 40, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
    color: #d0d0d0;

    &:hover {
      background-color: rgba(50, 50, 50, 0.9);
      color: #ffffff;
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
      .wave-icon {
        width: 36px;
        height: 36px;
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
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 20px;
  }
}
</style>
