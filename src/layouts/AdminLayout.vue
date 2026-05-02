<template>
  <div class="admin-layout">
    <el-container class="layout-container">
      <el-header class="layout-header">
        <div class="header-left">
          <div class="logo" @click="goHome">
            <img src="/logo.png" alt="OpenLOA" class="logo-image" />
          </div>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="36" :src="userAvatar" icon="UserFilled" />
              <span class="username">{{ nickName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container class="main-container">
        <el-main class="layout-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SwitchButton, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 使用computed获取store中的数据，这样当store更新时UI会自动更新
const nickName = computed(() => userStore.userInfo.nick_name)
const userAvatar = computed(() => userStore.userInfo.avatar_url)

const goHome = () => {
  router.push('/agent')
}

// 生命周期钩子：加载用户信息
onMounted(async () => {
  await userStore.loadUserInfo()
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_type')
    localStorage.removeItem('nick_name')
    userStore.clearUserInfo()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error) {
    console.log('取消退出')
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  width: 100%;
  height: 100%;
}

.layout-container {
  width: 100%;
  height: 100%;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;

    .logo {
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: transform 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      .logo-image {
        width: 150px;
        height: 100px;
        object-fit: contain;
      }

      .logo-text {
        margin-left: 10px;
        font-size: 20px;
        font-weight: 600;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .username {
        margin: 0 10px;
        font-size: 14px;
        color: #606266;
      }

      .el-icon {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.layout-main {
  background: #f0f2f5;
  overflow-y: auto;
  padding: 0;
}
</style>
