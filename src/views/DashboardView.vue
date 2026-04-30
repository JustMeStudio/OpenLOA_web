<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff;">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">1,234</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a;">
              <el-icon :size="30"><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">56</div>
              <div class="stat-label">课程总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c;">
              <el-icon :size="30"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">8,901</div>
              <div class="stat-label">练习次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c;">
              <el-icon :size="30"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">2,345</div>
              <div class="stat-label">社区动态</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>欢迎使用和弦王者音乐教育平台</span>
            </div>
          </template>
          <div class="welcome-content">
            <h2>开启你的音乐之旅 🎵</h2>
            <p>这里汇集了丰富的音乐课程、练习工具和社区交流，帮助你快速提升音乐技能。</p>
            <el-row :gutter="20" style="margin-top: 30px;">
              <el-col :span="8">
                <div class="feature-card">
                  <el-icon :size="40" color="#409eff"><VideoPlay /></el-icon>
                  <h3>专业课程</h3>
                  <p>由资深音乐教师精心打造的课程体系</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-card">
                  <el-icon :size="40" color="#67c23a"><Grid /></el-icon>
                  <h3>智能练习</h3>
                  <p>AI驱动的个性化练习方案</p>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="feature-card">
                  <el-icon :size="40" color="#e6a23c"><UserFilled /></el-icon>
                  <h3>活跃社区</h3>
                  <p>与全球音乐爱好者交流分享</p>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #fff;
      }

      .stat-info {
        margin-left: 20px;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
  }

  .welcome-content {
    text-align: center;
    padding: 30px 0;

    h2 {
      font-size: 28px;
      color: #303133;
      margin-bottom: 15px;
    }

    p {
      font-size: 16px;
      color: #606266;
      max-width: 800px;
      margin: 0 auto;
    }

    .feature-card {
      padding: 30px 20px;
      border-radius: 10px;
      background: #f5f7fa;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }

      h3 {
        margin: 15px 0 10px;
        font-size: 18px;
        color: #303133;
      }

      p {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}
</style>
