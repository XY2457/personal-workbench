/**
 * 图片压缩 - 自动转为 WebP，单张 ≤200KB
 */

export async function compressImage(
  file: File | Blob,
  maxSize: number = 200 * 1024,
  maxWidth: number = 1280,
  quality: number = 0.8
): Promise<Blob> {
  const img = await createImageBitmap(file)
  let width = img.width
  let height = img.height

  // 等比缩小
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width))
    width = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)

  // 尝试 WebP，逐步降低质量直到 ≤ maxSize
  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  let q = quality
  while (blob && blob.size > maxSize && q > 0.1) {
    q -= 0.1
    blob = await canvasToBlob(canvas, 'image/webp', q)
  }

  // 如果 WebP 仍然太大，用 JPEG
  if (!blob || blob.size > maxSize) {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.7)
    q = 0.7
    while (blob && blob.size > maxSize && q > 0.1) {
      q -= 0.1
      blob = await canvasToBlob(canvas, 'image/jpeg', q)
    }
  }

  return blob || new Blob([file], { type: 'image/webp' })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

export async function compressAndUpload(file: File, path: string): Promise<string> {
  const compressed = await compressImage(file)
  // 动态导入避免循环依赖
  const { uploadFile } = await import('./db')
  const webpPath = path.replace(/\.\w+$/, '.webp')
  return uploadFile(compressed, webpPath)
}
