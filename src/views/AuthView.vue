<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="brand">
        <div class="brand-logo">
          <svg class="wave-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="aLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M8 20 L14 20" stroke="url(#aLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M14 20 L14 10 Q17 7 20 10 L20 30 Q23 33 26 30 L26 14" stroke="url(#aLogoGrad)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path d="M26 14 L32 14" stroke="url(#aLogoGrad)" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
          <span class="brand-name">OpenLOA</span>
        </div>
        <p class="brand-tagline">AI Agent Platform</p>
      </div>
      <div class="left-decoration">
        <div class="deco-circle deco-c1"></div>
        <div class="deco-circle deco-c2"></div>
        <div class="deco-circle deco-c3"></div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">

        <div class="auth-tabs">
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'login' }"
            @click="activeTab = 'login'"
          >登录</button>
          <button
            class="auth-tab"
            :class="{ active: activeTab === 'register' }"
            @click="activeTab = 'register'"
          >注册</button>
          <div class="tab-indicator" :class="activeTab"></div>
        </div>

        <div class="auth-form-wrap">
          <LoginForm v-if="activeTab === 'login'" @login-success="handleLoginSuccess" />
          <RegisterForm v-else @register-success="handleRegisterSuccess" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '@/components/auth/LoginForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

const router = useRouter()
const activeTab = ref('login')

const handleLoginSuccess = () => {
  router.push('/')
}

const handleRegisterSuccess = () => {
  activeTab.value = 'login'
}
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  background: #f8f9fb;
}

// ── Left panel ──────────────────────────────────────────────────────────────
.auth-left {
  flex: 1;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 60px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }
}

.brand {
  position: relative;
  z-index: 1;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .wave-icon {
    width: 48px;
    height: 48px;
  }
}

.brand-name {
  font-size: 2.2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 400;
  line-height: 1.6;
  max-width: 360px;
}

.left-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.deco-c1 { width: 400px; height: 400px; right: -120px; bottom: -120px; }
.deco-c2 { width: 240px; height: 240px; right: 60px; top: 40px; }
.deco-c3 { width: 140px; height: 140px; left: 60%; top: 50%; transform: translateY(-50%); }

// ── Right panel ─────────────────────────────────────────────────────────────
.auth-right {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: #fff;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.auth-card {
  width: 100%;
  max-width: 380px;
}

.auth-lang {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 32px;

  :deep(.el-select) {
    --el-select-input-focus-border-color: #6366f1;
  }

  :deep(.el-select__input) {
    font-size: 0.95rem;
  }
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
.auth-tabs {
  position: relative;
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 32px;
}

.auth-tab {
  flex: 1;
  padding: 12px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  text-align: center;

  &.active {
    color: #6366f1;
    font-weight: 600;
  }

  &:hover:not(.active) {
    color: #6b7280;
  }
}

.tab-indicator {
  position: absolute;
  bottom: -2px;
  height: 2px;
  width: 50%;
  background: #6366f1;
  border-radius: 2px;
  transition: left 0.25s ease;

  &.login { left: 0; }
  &.register { left: 50%; }
}

// ── Form overrides ───────────────────────────────────────────────────────────
.auth-form-wrap {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb;

    &:hover {
      box-shadow: 0 0 0 1px #9ca3af;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px #6366f1;
    }
  }

  :deep(.el-input__inner) {
    color: #111827;
    font-weight: 500;
  }

  :deep(.el-input__wrapper.is-focus) {
    background-color: #f3f4f6;
  }

  :deep(.el-input__wrapper.is-focus .el-input__inner) {
    color: #000;
  }

  :deep(.el-button--primary) {
    background: #6366f1;
    border-color: #6366f1;
    border-radius: 8px;
    font-weight: 600;

    &:hover {
      background: #4f46e5;
      border-color: #4f46e5;
    }
  }

  :deep(.el-link) {
    color: #6366f1;
  }

  :deep(.verify-code-wrapper) {
    display: flex;
    gap: 10px;
    align-items: center;

    .el-input { flex: 1; }
  }

  :deep(.el-button) {
    border-radius: 8px;
  }
}
</style>