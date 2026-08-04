// 生成 PWA 图标 - 像素森系风格
import { createCanvas } from 'canvas'

function createIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const px = size / 32 // pixel unit
  
  // 背景 - 深墨绿
  ctx.fillStyle = '#1A3C2A'
  ctx.fillRect(0, 0, size, size)
  
  // 像素叶片
  ctx.fillStyle = '#7DBF8A'
  // 叶子主体
  const leaf = [
    [10,4,4,1],[9,5,6,1],[8,6,8,1],[8,7,8,2],
    [9,9,6,1],[10,10,4,1],[11,11,2,1],
    [12,12,2,1],[13,13,2,1],[14,14,2,1],
    [15,15,2,1],[16,16,2,1]
  ]
  leaf.forEach(([x,y,w,h]) => ctx.fillRect(x*px, y*px, w*px, h*px))
  
  // 叶子高光
  ctx.fillStyle = '#A8D8B0'
  const hl = [[10,5,2,1],[9,6,2,1],[10,7,2,1]]
  hl.forEach(([x,y,w,h]) => ctx.fillRect(x*px, y*px, w*px, h*px))
  
  // 像素花朵
  ctx.fillStyle = '#FFD54F'
  ctx.fillRect(20*px, 18*px, 4*px, 4*px)
  ctx.fillStyle = '#E57373'
  ctx.fillRect(19*px, 17*px, 2*px, 2*px)
  ctx.fillRect(23*px, 17*px, 2*px, 2*px)
  ctx.fillRect(19*px, 21*px, 2*px, 2*px)
  ctx.fillRect(23*px, 21*px, 2*px, 2*px)
  
  return canvas
}

// We can't use 'canvas' package in this environment, so let's create SVG-based icons instead
console.log('Icon generation script ready')
