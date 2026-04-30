<template>
  <div class="announcement-carousel" v-if="announcements.length > 0" :class="{ sidebar: isSidebar }">
    <div class="carousel-container">
      <!-- 侧栏版本 -->
      <template v-if="isSidebar">
        <div class="sidebar-carousel">
          <div class="sidebar-header">
            <span class="sidebar-icon">📢</span>
            <span class="sidebar-counter">{{ currentIndex + 1 }}/{{ announcements.length }}</span>
          </div>
          <div class="sidebar-content">
            <div class="announcement-type" :class="`type-${announcements[currentIndex].type}`">
              {{ getTypeLabel(announcements[currentIndex].type) }}
            </div>
            <div class="announcement-title">
              {{ announcements[currentIndex].title }}
            </div>
            <div class="announcement-message">
              {{ announcements[currentIndex].message }}
            </div>
          </div>
          <div class="sidebar-controls">
            <button 
              class="control-btn"
              @click="goToPrev"
              title="上一条"
            >
              ‹
            </button>
            <button 
              class="control-btn"
              @click="toggleAutoPlay"
              :title="autoPlay ? '暂停' : '播放'"
            >
              {{ autoPlay ? '⏸' : '▶' }}
            </button>
            <button 
              class="control-btn"
              @click="goToNext"
              title="下一条"
            >
              ›
            </button>
          </div>
        </div>
      </template>

      <!-- 完整版本 -->
      <template v-else>
        <div class="carousel-header">
          <span class="carousel-title">
            <span class="title-icon">📢</span>
            公告
          </span>
          <span class="carousel-indicator">
            {{ currentIndex + 1 }}/{{ announcements.length }}
          </span>
        </div>

        <div class="carousel-body">
          <button 
            v-if="announcements.length > 1"
            class="carousel-btn prev"
            @click="goToPrev"
            :disabled="autoPlay"
          >
            ❮
          </button>

          <transition name="fade" mode="out-in">
            <div :key="currentIndex" class="announcement-content">
              <div class="announcement-type" :class="`type-${announcements[currentIndex].type}`">
                {{ getTypeLabel(announcements[currentIndex].type) }}
              </div>
              <div class="announcement-title">
                {{ announcements[currentIndex].title }}
              </div>
              <div class="announcement-message">
                {{ announcements[currentIndex].message }}
              </div>
              <div v-if="announcements[currentIndex].startTime" class="announcement-time">
                {{ announcements[currentIndex].startTime }}
              </div>
            </div>
          </transition>

          <button 
            v-if="announcements.length > 1"
            class="carousel-btn next"
            @click="goToNext"
            :disabled="autoPlay"
          >
            ❯
          </button>
        </div>

        <div v-if="announcements.length > 1" class="carousel-dots">
          <span 
            v-for="(_, index) in announcements"
            :key="index"
            class="dot"
            :class="{ active: index === currentIndex }"
            @click="goToIndex(index)"
          ></span>
        </div>

        <button 
          class="carousel-control-btn"
          @click="toggleAutoPlay"
          :title="autoPlay ? '暂停轮播' : '开始轮播'"
        >
          {{ autoPlay ? '⏸️' : '▶️' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  announcements: {
    type: Array,
    default: () => []
  },
  autoPlayInterval: {
    type: Number,
    default: 5000 // 5 seconds
  },
  isSidebar: {
    type: Boolean,
    default: false
  }
})

const currentIndex = ref(0)
const autoPlay = ref(true)
let autoPlayTimer = null

const getTypeLabel = (type) => {
  const typeMap = {
    'maintenance': '🔧 维护',
    'important': '⚠️ 重要',
    'feature': '✨ 新功能',
    'update': '📝 更新'
  }
  return typeMap[type] || '📢 公告'
}

const goToNext = () => {
  currentIndex.value = (currentIndex.value + 1) % props.announcements.length
  resetAutoPlayTimer()
}

const goToPrev = () => {
  currentIndex.value = (currentIndex.value - 1 + props.announcements.length) % props.announcements.length
  resetAutoPlayTimer()
}

const goToIndex = (index) => {
  currentIndex.value = index
  resetAutoPlayTimer()
}

const toggleAutoPlay = () => {
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    startAutoPlay()
  } else {
    clearTimeout(autoPlayTimer)
  }
}

const startAutoPlay = () => {
  resetAutoPlayTimer()
}

const resetAutoPlayTimer = () => {
  clearTimeout(autoPlayTimer)
  if (autoPlay.value) {
    autoPlayTimer = setTimeout(() => {
      goToNext()
    }, props.autoPlayInterval)
  }
}

onMounted(() => {
  if (autoPlay.value && props.announcements.length > 1) {
    startAutoPlay()
  }
})

onUnmounted(() => {
  clearTimeout(autoPlayTimer)
})
</script>

<style scoped>
.announcement-carousel {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f3f7 100%);
}

.announcement-carousel.sidebar {
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* ========== 侧栏版本样式 ========== */
.sidebar-carousel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background-color: #ffffff;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  padding: 0 2px;
}

.sidebar-icon {
  font-size: 14px;
}

.sidebar-counter {
  font-weight: 500;
  color: #4b5563;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-content .announcement-type {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}

.sidebar-content .announcement-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.sidebar-content .announcement-message {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sidebar-controls {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid #e5e7eb;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  background-color: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex: 1;
}

.control-btn:hover {
  border-color: #6366f1;
  background-color: #f0f4ff;
  color: #6366f1;
}

/* ========== 完整版本样式 ========== */
.carousel-container:not(.sidebar) {
  position: relative;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
}

.carousel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.title-icon {
  font-size: 16px;
}

.carousel-indicator {
  font-size: 12px;
  color: #6b7280;
}

.carousel-body {
  display: flex;
  align-items: center;
  padding: 16px;
  min-height: 80px;
  gap: 12px;
  background-color: #ffffff;
}

.announcement-content {
  flex: 1;
  min-width: 0;
}

.announcement-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  width: fit-content;
}

.announcement-type.type-maintenance {
  background-color: #fef3c7;
  color: #92400e;
}

.announcement-type.type-important {
  background-color: #fee2e2;
  color: #991b1b;
}

.announcement-type.type-feature {
  background-color: #d1fae5;
  color: #065f46;
}

.announcement-type.type-update {
  background-color: #dbeafe;
  color: #0c2d6b;
}

.announcement-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  margin-top: 4px;
}

.announcement-message {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.announcement-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.carousel-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background-color: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.carousel-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background-color: #f3f4f6;
  color: #6366f1;
}

.carousel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db;
  cursor: pointer;
  transition: all 0.3s;
}

.dot.active {
  background-color: #6366f1;
  transform: scale(1.2);
}

.dot:hover {
  background-color: #9ca3af;
}

.carousel-control-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.carousel-control-btn:hover {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
