/**
 * 像素风手绘 SVG 图标系统
 * 统一绿色系像素风格
 */

interface IconProps {
  size?: number
  color?: string
}

const PX = 4 // 像素单位

// 辅助：将像素坐标转为 SVG rect
function px(x: number, y: number, w: number = 1, h: number = 1, fill: string): string {
  return `<rect x="${x * PX}" y="${y * PX}" width="${w * PX}" height="${h * PX}" fill="${fill}"/>`
}

// 今日中枢 - 像素太阳+叶片
export function PixelTodayIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', y = '#FFD54F'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(4,4,2,1,y)}${px(3,5,4,2,y)}${px(4,7,2,1,y)}
      ${px(10,2,1,3,c)}${px(11,5,1,2,c)}${px(10,7,1,2,c)}
      ${px(6,10,1,1,c)}${px(5,11,3,1,c)}${px(4,12,5,2,c)}${px(5,14,3,1,c)}${px(6,15,1,1,c)}
      ${px(8,13,1,1,d)}${px(10,13,1,1,d)}
      ${px(7,16,4,1,c)}${px(8,17,3,1,c)}${px(9,18,1,1,c)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 客户跟踪 - 像素人形
export function PixelCustomerIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', s = '#A8D8EA'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(5,3,2,1,s)}${px(4,4,4,3,s)}${px(5,7,2,1,s)}
      ${px(6,8,1,1,c)}${px(5,9,3,2,c)}${px(4,11,5,3,c)}${px(3,14,7,2,c)}${px(4,16,5,1,c)}
      ${px(5,17,2,4,c)}${px(7,17,1,4,c)}
      ${px(10,13,5,1,c)}${px(11,12,3,1,c)}${px(12,14,1,2,c)}
      ${px(11,16,3,1,c)}${px(12,17,1,3,c)}${px(11,20,3,1,c)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 智能提醒 - 像素闹钟
export function PixelReminderIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', r = '#E57373'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,2,2,1,r)}${px(12,2,2,1,r)}
      ${px(4,4,4,1,c)}${px(12,4,4,1,c)}
      ${px(5,5,10,2,c)}${px(5,7,10,4,c)}${px(6,11,8,1,c)}
      ${px(7,12,6,1,c)}${px(8,13,4,1,c)}${px(9,14,2,1,c)}
      ${px(9,8,1,3,d)}${px(9,8,2,1,d)}
      ${px(6,13,2,1,c)}${px(12,13,2,1,c)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 灵感补给 - 像素灯泡
export function PixelInspirationIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', y = '#FFD54F'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,2,1,1,y)}${px(10,2,1,1,y)}${px(5,3,1,1,y)}${px(11,3,1,1,y)}
      ${px(5,4,7,1,y)}${px(4,5,9,2,y)}${px(4,7,9,2,y)}
      ${px(5,9,7,1,y)}${px(6,10,5,1,y)}${px(7,11,3,1,c)}
      ${px(7,12,3,1,c)}${px(7,13,3,1,c)}
      ${px(7,14,3,1,d)}${px(7,15,3,1,d)}
      ${px(6,12,1,2,y)}${px(10,12,1,2,y)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 每日随手记 - 像素日记本
export function PixelNoteIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', w = '#FFFFFF'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(5,3,8,1,c)}${px(4,4,1,8,c)}${px(13,4,1,8,c)}${px(5,12,8,1,c)}
      ${px(5,4,8,8,w)}
      ${px(6,5,1,1,c)}${px(8,5,1,1,c)}${px(10,5,1,1,c)}
      ${px(6,6,6,1,d)}${px(6,8,6,1,d)}${px(6,10,4,1,d)}
      ${px(3,5,1,1,'#D4A03A')}${px(3,7,1,1,'#D4A03A')}${px(3,9,1,1,'#D4A03A')}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 单词学习 - 像素字母A
export function PixelWordIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,4,4,1,c)}${px(5,5,1,1,c)}${px(10,5,1,1,c)}${px(4,6,1,2,c)}${px(11,6,1,2,c)}
      ${px(3,8,1,4,c)}${px(12,8,1,4,c)}${px(4,12,1,2,c)}${px(11,12,1,2,c)}
      ${px(4,7,8,1,c)}${px(4,10,8,1,c)}
      ${px(5,8,1,1,d)}${px(8,8,1,1,d)}${px(5,9,1,1,d)}${px(8,9,1,1,d)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 时光胶囊 - 像素心形 (保留兼容)
export function PixelCapsuleIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = '#E57373', d = '#C62828'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,5,2,1,c)}${px(10,5,2,1,c)}${px(5,6,4,1,c)}${px(9,6,4,1,c)}
      ${px(4,7,10,1,c)}${px(4,8,10,1,c)}${px(5,9,8,1,c)}${px(6,10,6,1,c)}
      ${px(7,11,4,1,c)}${px(8,12,2,1,c)}
      ${px(6,7,1,1,d)}${px(9,7,1,1,d)}${px(7,9,2,1,d)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 小孩成长记录 - 像素宝宝
export function PixelChildIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const c = color, d = '#1A3C2A', s = '#FFCC80', p = '#F48FB1', b = '#81D4FA'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,3,4,1,s)}${px(5,4,6,3,s)}${px(6,7,4,1,s)}
      ${px(7,4,1,1,'#E0A060')}${px(9,4,1,1,'#E0A060')}
      ${px(7,6,1,1,p)}${px(9,6,1,1,p)}
      ${px(6,8,1,1,c)}${px(5,9,3,2,c)}${px(4,11,5,2,c)}${px(5,13,3,1,c)}
      ${px(6,14,2,1,c)}${px(7,15,2,1,c)}
      ${px(4,9,1,1,b)}${px(8,9,1,1,b)}${px(2,11,2,1,c)}${px(9,11,2,1,c)}
      ${px(3,12,1,1,b)}${px(9,12,1,1,b)}
      ${px(10,11,1,1,c)}${px(6,13,1,1,d)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 财富工坊 - 像素金币
export function PixelWealthIcon({ size = 24, color = '#7DBF8A' }: IconProps) {
  const g = '#D4A03A', d = '#8B6914', l = '#FFD54F'
  const svg = `
    <svg viewBox="0 0 32 32" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,5,4,1,g)}${px(5,6,1,2,g)}${px(10,6,1,2,g)}${px(6,8,4,1,g)}
      ${px(6,6,4,2,l)}
      ${px(4,9,8,1,g)}${px(3,10,1,4,g)}${px(12,10,1,4,g)}${px(4,14,8,1,g)}
      ${px(4,10,8,4,l)}
      ${px(6,11,1,2,d)}${px(7,11,2,1,d)}${px(7,12,2,1,d)}${px(6,12,1,1,d)}
      ${px(5,15,6,1,g)}${px(6,16,4,1,g)}${px(7,17,2,1,g)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 像素叶片装饰
export function PixelLeaf({ size = 16, color = '#5A7A4A' }: IconProps) {
  const c = color, l = '#7DBF8A'
  const svg = `
    <svg viewBox="0 0 20 20" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(3,3,2,1,c)}${px(2,4,4,1,c)}${px(2,5,5,1,l)}${px(3,6,5,1,l)}${px(4,7,4,1,l)}
      ${px(5,8,3,1,c)}${px(6,9,2,1,c)}${px(7,10,1,1,c)}
      ${px(4,5,1,1,c)}${px(6,6,1,1,c)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 像素花朵装饰
export function PixelFlower({ size = 16, color = '#7DBF8A' }: IconProps) {
  const p = '#E57373', y = '#FFD54F', g = '#5A7A4A'
  const svg = `
    <svg viewBox="0 0 20 20" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(4,2,2,1,p)}${px(3,3,4,1,p)}${px(4,4,2,1,p)}
      ${px(7,3,2,1,p)}${px(7,4,4,1,p)}${px(8,5,2,1,p)}
      ${px(4,7,2,1,p)}${px(3,8,4,1,p)}${px(4,9,2,1,p)}
      ${px(7,7,2,1,p)}${px(7,8,4,1,p)}${px(8,9,2,1,p)}
      ${px(5,5,4,3,y)}
      ${px(6,10,2,1,g)}${px(6,11,2,2,g)}${px(5,12,1,1,g)}${px(8,12,1,1,g)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 像素树
export function PixelTree({ size = 20, color = '#5A7A4A' }: IconProps) {
  const c = color, d = '#2D5A3D', l = '#7DBF8A', b = '#8B6914'
  const svg = `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(6,2,4,1,c)}${px(5,3,6,1,c)}${px(4,4,8,1,c)}${px(4,5,8,2,d)}
      ${px(5,7,6,1,d)}${px(6,8,4,1,c)}
      ${px(7,4,1,1,l)}${px(9,5,1,1,l)}${px(6,6,1,1,l)}${px(10,4,1,1,l)}
      ${px(8,9,2,1,b)}${px(8,10,2,3,b)}${px(7,13,4,1,b)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 像素苹果
export function PixelApple({ size = 16, color = '#E57373' }: IconProps) {
  const r = color, d = '#C62828', g = '#5A7A4A', br = '#8B6914'
  const svg = `
    <svg viewBox="0 0 20 20" width="${size}" height="${size}" class="pixelated" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${px(5,4,4,1,r)}${px(4,5,6,2,r)}${px(4,7,6,3,r)}${px(5,10,4,1,r)}
      ${px(6,5,2,1,'#FF8A80')} 
      ${px(7,3,1,1,br)}${px(8,2,2,1,g)}
    </svg>
  `
  return <span dangerouslySetInnerHTML={{ __html: svg }} />
}

// 图标映射
export const ICONS = {
  today: PixelTodayIcon,
  customers: PixelCustomerIcon,
  reminders: PixelReminderIcon,
  inspiration: PixelInspirationIcon,
  notes: PixelNoteIcon,
  words: PixelWordIcon,
  capsule: PixelChildIcon,
  wealth: PixelWealthIcon,
}
