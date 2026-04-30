<template>
  <div class="courses">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>课程中心</span>
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            添加课程
          </el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="course in courses" :key="course.id">
          <el-card class="course-card" :body-style="{ padding: '0px' }">
            <img :src="course.image" class="course-image" />
            <div style="padding: 14px;">
              <h3>{{ course.title }}</h3>
              <p class="course-desc">{{ course.description }}</p>
              <div class="course-footer">
                <span class="course-level">{{ course.level }}</span>
                <span class="course-duration">{{ course.duration }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const courses = ref([
  {
    id: 1,
    title: '钢琴入门教程',
    description: '从零开始学习钢琴，掌握基础乐理知识和演奏技巧',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=piano%20lesson%20beginner%20music%20keys&image_size=square',
    level: '初级',
    duration: '24课时'
  },
  {
    id: 2,
    title: '吉他和弦进阶',
    description: '深入学习吉他和弦，掌握丰富的和声进行和弹唱技巧',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=guitar%20chords%20playing%20music&image_size=square',
    level: '中级',
    duration: '36课时'
  },
  {
    id: 3,
    title: '爵士钢琴大师课',
    description: '跟随大师学习爵士钢琴，感受蓝调与即兴的魅力',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jazz%20piano%20concert%20performance&image_size=square',
    level: '高级',
    duration: '48课时'
  }
])
</script>

<style scoped lang="scss">
.courses {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .course-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .course-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 4px 4px 0 0;
    }

    h3 {
      font-size: 18px;
      color: #303133;
      margin: 0 0 10px;
    }

    .course-desc {
      font-size: 14px;
      color: #909399;
      margin: 0 0 15px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .course-level {
        font-size: 12px;
        padding: 2px 8px;
        background: #409eff;
        color: #fff;
        border-radius: 4px;
      }

      .course-duration {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
