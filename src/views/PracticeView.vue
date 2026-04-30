<template>
  <div class="practice">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>练习中心</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="practice-module" shadow="hover">
            <div class="module-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="48"><Music /></el-icon>
            </div>
            <h3>和弦练习</h3>
            <p>练习各类和弦的按法与转换，提升和弦熟练度</p>
            <el-button type="primary" style="margin-top: 15px;">开始练习</el-button>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="practice-module" shadow="hover">
            <div class="module-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="48"><Timer /></el-icon>
            </div>
            <h3>节奏训练</h3>
            <p>通过节拍器和节奏游戏，培养稳定的节奏感</p>
            <el-button type="primary" style="margin-top: 15px;">开始练习</el-button>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="practice-module" shadow="hover">
            <div class="module-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="48"><Headset /></el-icon>
            </div>
            <h3>听力训练</h3>
            <p>训练音程、和弦、旋律的听辨能力</p>
            <el-button type="primary" style="margin-top: 15px;">开始练习</el-button>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="practice-module" shadow="hover">
            <div class="module-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <el-icon :size="48"><Document /></el-icon>
            </div>
            <h3>视唱练耳</h3>
            <p>综合练习视唱和听写，全面提升音乐素养</p>
            <el-button type="primary" style="margin-top: 15px;">开始练习</el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.practice {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .practice-module {
    text-align: center;
    padding: 30px 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .module-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      color: #fff;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 22px;
      color: #303133;
      margin: 0 0 10px;
    }

    p {
      font-size: 14px;
      color: #909399;
      margin: 0;
      line-height: 1.6;
    }
  }
}
</style>
