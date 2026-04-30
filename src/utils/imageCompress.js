/**
 * 图片压缩工具
 * 用于在上传前压缩图片，保持图片清晰度的同时减小文件大小
 */

/**
 * 检查文件是否为图片
 * @param {File} file - 文件对象
 * @returns {boolean} - 是否为图片
 */
export const isImageFile = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return imageTypes.includes(file.type)
}

/**
 * 获取合适的压缩质量
 * 根据图片尺寸自动选择压缩质量，平衡文件大小和清晰度
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @param {number} originalSize - 原文件大小（字节）
 * @returns {number} - 压缩质量（0-1）
 */
const getOptimalQuality = (width, height, originalSize) => {
  // 如果文件已经很小，则不压缩
  if (originalSize < 500 * 1024) { // 小于500KB
    return 0.9
  }
  
  // 根据图片尺寸调整质量
  const pixelCount = width * height
  
  if (pixelCount < 1000 * 1000) {
    // 小于100万像素：中等质量
    return 0.85
  } else if (pixelCount < 2000 * 1000) {
    // 100-200万像素：较低质量
    return 0.8
  } else if (pixelCount < 5000 * 1000) {
    // 200-500万像素：低质量
    return 0.75
  } else {
    // 超过500万像素：很低质量
    return 0.7
  }
}

/**
 * 计算缩放尺寸
 * 如果图片尺寸过大，需要缩放以保持合理的文件大小
 * @param {number} width - 原始宽度
 * @param {number} height - 原始高度
 * @returns {Object} - {width, height} 目标尺寸
 */
const getScaledDimensions = (width, height) => {
  // 最大限制：宽度不超过2560，高度不超过2560
  const MAX_WIDTH = 2560
  const MAX_HEIGHT = 2560
  
  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    return { width, height }
  }
  
  const ratio = width / height
  let newWidth = width
  let newHeight = height
  
  if (width > MAX_WIDTH) {
    newWidth = MAX_WIDTH
    newHeight = Math.round(MAX_WIDTH / ratio)
  }
  
  if (newHeight > MAX_HEIGHT) {
    newHeight = MAX_HEIGHT
    newWidth = Math.round(MAX_HEIGHT * ratio)
  }
  
  return { width: newWidth, height: newHeight }
}

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @returns {Promise<File>} - 压缩后的图片文件
 */
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      // 不是图片，直接返回原文件
      resolve(file)
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          // 获取合适的缩放尺寸
          const { width, height } = getScaledDimensions(img.naturalWidth, img.naturalHeight)
          
          // 获取合适的压缩质量
          const quality = getOptimalQuality(width, height, file.size)
          
          console.log(`[图片压缩] 原始尺寸: ${img.naturalWidth}x${img.naturalHeight}, 原始大小: ${(file.size / 1024).toFixed(2)}KB`)
          console.log(`[图片压缩] 目标尺寸: ${width}x${height}, 压缩质量: ${(quality * 100).toFixed(0)}%`)
          
          // 创建canvas进行压缩
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = width
          canvas.height = height
          
          // 绘制缩放后的图片
          ctx.drawImage(img, 0, 0, width, height)
          
          // 转换为blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'))
                return
              }
              
              const compressedSize = blob.size
              const compressionRatio = ((1 - compressedSize / file.size) * 100).toFixed(2)
              console.log(`[图片压缩] 压缩后大小: ${(compressedSize / 1024).toFixed(2)}KB, 压缩率: ${compressionRatio}%`)
              
              // 创建新的File对象，保持原有的文件名
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: file.lastModified
              })
              
              resolve(compressedFile)
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      // 处理CORS或其他跨域问题
      img.crossOrigin = 'anonymous'
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 批量压缩图片
 * @param {File[]} files - 文件数组
 * @returns {Promise<File[]>} - 压缩后的文件数组
 */
export const compressImages = async (files) => {
  const compressedFiles = []
  
  for (const file of files) {
    try {
      const compressed = await compressImage(file)
      compressedFiles.push(compressed)
    } catch (error) {
      console.error(`[图片压缩] 压缩文件 ${file.name} 失败:`, error)
      // 压缩失败时使用原文件
      compressedFiles.push(file)
    }
  }
  
  return compressedFiles
}

/**
 * 计算头像压缩的尺寸和质量
 * 头像需要压缩到50KB以下，所以采用更激进的压缩策略
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @returns {Object} - {width, height, quality}
 */
const getAvatarCompressionParams = (width, height) => {
  // 头像最大尺寸：512x512（足够清晰显示）
  const MAX_SIZE = 512
  
  // 计算缩放尺寸
  let newWidth = width
  let newHeight = height
  
  if (width > MAX_SIZE || height > MAX_SIZE) {
    const ratio = width / height
    if (width > height) {
      newWidth = MAX_SIZE
      newHeight = Math.round(MAX_SIZE / ratio)
    } else {
      newHeight = MAX_SIZE
      newWidth = Math.round(MAX_SIZE * ratio)
    }
  }
  
  // 头像采用较低质量以确保50KB以下
  // 512x512的头像通常质量40-50%就足够了
  let quality = 0.45
  
  // 如果尺寸更小，可以用更高的质量
  if (newWidth <= 256 && newHeight <= 256) {
    quality = 0.55
  }
  
  return { width: newWidth, height: newHeight, quality }
}

/**
 * 压缩头像图片到50KB以下
 * 用于用户头像上传，采用更激进的压缩策略
 * @param {File} file - 头像图片文件
 * @returns {Promise<File>} - 压缩后的头像文件
 */
export const compressAvatarImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      // 不是图片，直接返回原文件
      resolve(file)
      return
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const { width, height, quality } = getAvatarCompressionParams(img.naturalWidth, img.naturalHeight)
          
          console.log(`[头像压缩] 原始尺寸: ${img.naturalWidth}x${img.naturalHeight}, 原始大小: ${(file.size / 1024).toFixed(2)}KB`)
          console.log(`[头像压缩] 目标尺寸: ${width}x${height}, 压缩质量: ${(quality * 100).toFixed(0)}%`)
          
          // 创建canvas进行压缩
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = width
          canvas.height = height
          
          // 绘制缩放后的图片
          ctx.drawImage(img, 0, 0, width, height)
          
          // 转换为blob，采用递归压缩直到达到目标大小
          const compressToTarget = (targetQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('头像压缩失败'))
                  return
                }
                
                const compressedSize = blob.size
                const targetSize = 50 * 1024 // 50KB
                
                console.log(`[头像压缩] 当前大小: ${(compressedSize / 1024).toFixed(2)}KB (质量: ${(targetQuality * 100).toFixed(0)}%)`)
                
                // 如果已经达到目标或质量已经很低，就返回
                if (compressedSize <= targetSize || targetQuality <= 0.25) {
                  const compressionRatio = ((1 - compressedSize / file.size) * 100).toFixed(2)
                  console.log(`[头像压缩] 最终大小: ${(compressedSize / 1024).toFixed(2)}KB, 压缩率: ${compressionRatio}%`)
                  
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: file.lastModified
                  })
                  resolve(compressedFile)
                  return
                }
                
                // 如果没有达到目标，降低质量重新压缩
                if (compressedSize > targetSize) {
                  const newQuality = targetQuality * 0.9 // 降低10%质量
                  compressToTarget(newQuality)
                } else {
                  const compressionRatio = ((1 - compressedSize / file.size) * 100).toFixed(2)
                  console.log(`[头像压缩] 最终大小: ${(compressedSize / 1024).toFixed(2)}KB, 压缩率: ${compressionRatio}%`)
                  
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: file.lastModified
                  })
                  resolve(compressedFile)
                }
              },
              'image/jpeg',
              targetQuality
            )
          }
          
          // 开始压缩，初始质量45%
          compressToTarget(quality)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.crossOrigin = 'anonymous'
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}
