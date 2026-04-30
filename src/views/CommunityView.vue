<template>
  <div class="community">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>社区动态</span>
          <el-button type="primary">
            <el-icon><Edit /></el-icon>
            发布动态
          </el-button>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="activity.timestamp"
          placement="top"
        >
          <el-card class="post-card">
            <div class="post-header">
              <el-avatar :size="40" :src="activity.avatar" />
              <div class="user-info">
                <span class="username">{{ activity.username }}</span>
                <span class="action">{{ activity.action }}</span>
              </div>
            </div>
            <div class="post-content">
              <p>{{ activity.content }}</p>
              <div v-if="activity.image" class="post-image">
                <img :src="activity.image" alt="" />
              </div>
            </div>
            <div class="post-footer">
              <span>
                <el-icon><ChatDotRound /></el-icon>
                {{ activity.comments }}
              </span>
              <span>
                <el-icon><Star /></el-icon>
                {{ activity.likes }}
              </span>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activities = ref([
  {
    username: '音乐达人小王',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    action: '完成了《爵士钢琴入门》课程',
    content: '终于完成了！感谢老师的耐心讲解，收获满满！',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20certificate%20achievement%20celebration&image_size=square',
    timestamp: '2024-01-15 14:30',
    comments: 12,
    likes: 45
  },
  {
    username: '吉他爱好者',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    action: '分享了练习视频',
    content: '今天练习了C大调和弦转换，感觉比昨天流畅多了！继续加油💪',
    image: null,
    timestamp: '2024-01-15 12:15',
    comments: 8,
    likes: 32
  },
  {
    username: '新手学琴',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    action: '发布了问题',
    content: '请问各位大佬，左手和弦转换有什么技巧吗？总是卡壳...',
    image: null,
    timestamp: '2024-01-15 10:05',
    comments: 23,
    likes: 18
  }
])
</script>

<style scoped lang="scss">
.community {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .post-card {
    margin-bottom: 10px;

    .post-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;

      .user-info {
        margin-left: 12px;
        display: flex;
        flex-direction: column;

        .username {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .action {
          font-size: 13px;
          color: #909399;
          margin-top: 3px;
        }
      }
    }

    .post-content {
      margin-bottom: 15px;

      p {
        font-size: 14px;
        color: #606266;
        line-height: 1.6;
        margin: 0 0 10px;
      }

      .post-image {
        img {
          max-width: 400px;
          border-radius: 8px;
        }
      }
    }

    .post-footer {
      display: flex;
      gap: 30px;
      color: #909399;
      font-size: 14px;

      span {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;

        &:hover {
          color: #409eff;
        }
      }
    }
  }
}
</style>
