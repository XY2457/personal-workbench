/**
 * 数据导出 - JSON / CSV
 */

import { exportAllData } from './db'

export async function exportJSON(): Promise<void> {
  const data = await exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `workbench-backup-${dateStr()}.json`)
}

export async function exportCSV(): Promise<void> {
  const data = await exportAllData()
  let csv = ''
  for (const [table, rows] of Object.entries(data)) {
    csv += `\n# ${table}\n`
    if (rows.length === 0) {
      csv += '(empty)\n'
      continue
    }
    const headers = Object.keys(rows[0])
    csv += headers.join(',') + '\n'
    for (const row of rows) {
      csv += headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
        return `"${String(val).replace(/"/g, '""')}"`
      }).join(',') + '\n'
    }
  }
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `workbench-backup-${dateStr()}.csv`)
}

export async function exportTableTXT(table: string, items: any[]): Promise<void> {
  let txt = ''
  for (const item of items) {
    txt += `${item.text || item.content || ''}\n`
    if (item.author) txt += `  —— ${item.author}\n`
    if (item.category) txt += `  [${item.category}]\n`
    txt += `\n`
  }
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `${table}-${dateStr()}.txt`)
}

// ===== 导出全部数据 - TXT / Word =====

// 表中文名映射
const TABLE_NAMES: Record<string, string> = {
  todos: '今日待办',
  dailyplans: '每日计划',
  daily_todos: '每日待办',
  customers: '客户跟踪',
  reminders: '智能提醒',
  inspirations: '灵感补给',
  excerpts: '摘抄收藏',
  daily_notes: '每日随手记',
  words: '单词学习',
  growth_metrics: '成长指标',
  milestones: '成长里程碑',
  growth_diaries: '成长日记',
  memos: '便签备忘',
  expenses: '日常开销',
  fixed_expenses: '固定支出',
  shopping_items: '购物清单',
  wish_items: '心愿兑换',
  accounts: '日常账户',
}

// 字段中文名映射
const FIELD_NAMES: Record<string, string> = {
  id: 'ID', title: '标题', content: '内容', text: '内容', notes: '备注', memo: '备注',
  category: '分类', priority: '优先级', status: '状态', date: '日期',
  startTime: '开始时间', endTime: '结束时间', repeat: '重复',
  subTasks: '子任务', done: '完成', author: '作者',
  created_at: '创建时间', updated_at: '更新时间',
  word: '单词', meaning: '释义', phonetic: '音标', example: '例句',
  name: '名称', phone: '电话', company: '公司', amount: '金额', type: '类型',
  remindAt: '提醒时间', remindType: '提醒类型', isDone: '是否完成',
  target: '目标', progress: '进度', link: '链接', quote: '摘抄', icon: '图标',
}

// 枚举值翻译为中文
function translateValue(key: string, value: any): any {
  if (value === null || value === undefined) return value
  const s = String(value)
  if (key === 'priority') {
    if (s === 'high') return '高'
    if (s === 'medium') return '中'
    if (s === 'low') return '低'
  }
  if (key === 'status') {
    if (s === 'todo') return '待办'
    if (s === 'doing') return '进行中'
    if (s === 'done') return '已完成'
  }
  if (key === 'repeat') {
    if (s === 'none') return '不重复'
    if (s === 'daily') return '每天'
    if (s === 'weekly') return '每周'
    if (s === 'monthly') return '每月'
  }
  if (key === 'category') {
    if (s === 'work') return '工作'
    if (s === 'study') return '学习'
    if (s === 'life') return '生活'
    if (s === 'other') return '其他'
  }
  if (s === 'true') return '是'
  if (s === 'false') return '否'
  return value
}

// 字段值格式化为纯文本
function formatFieldValue(key: string, value: any): string {
  if (value === null || value === undefined || key === 'user_id') return ''
  // 子任务数组：✓/✗ + 内容
  if (key === 'subTasks' && Array.isArray(value)) {
    if (value.length === 0) return '(无)'
    return value.map((st: any) => (st && st.done ? '✓ ' : '✗ ') + (st && st.content ? st.content : '')).join('\n')
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '(无)'
    return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('、')
  }
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  return String(translateValue(key, value))
}

// 一条记录转多行文本
function formatRecordLines(index: number, row: Record<string, any>): string[] {
  const lines: string[] = []
  // 主标题字段优先展示
  const titleKey = ['title', 'content', 'text', 'word', 'name', 'quote'].find(k => row[k])
  const title = titleKey ? formatFieldValue(titleKey, row[titleKey]) : ''
  lines.push(`${index + 1}. ${title || '(未命名)'}`)
  const skip = new Set(['user_id', 'id', ...(titleKey ? [titleKey] : [])])
  for (const [key, value] of Object.entries(row)) {
    if (skip.has(key)) continue
    const label = FIELD_NAMES[key] || key
    const val = formatFieldValue(key, value)
    if (val === '' || val === undefined) continue
    // 多行值（如子任务）单独缩进展示
    if (val.includes('\n')) {
      lines.push(`   ${label}:`)
      for (const sub of val.split('\n')) lines.push(`     ${sub}`)
    } else {
      lines.push(`   ${label}: ${val}`)
    }
  }
  return lines
}

// 导出全部数据为 TXT（带 BOM 防止中文乱码）
export async function exportAllTXT(): Promise<void> {
  const data = await exportAllData()
  const lines: string[] = []
  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0)
  lines.push('='.repeat(44))
  lines.push('  森系工作台 · 全部数据导出')
  lines.push('='.repeat(44))
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`)
  lines.push(`数据类别: ${Object.keys(data).length} 类 | 记录总数: ${total} 条`)
  lines.push('')
  for (const [table, rows] of Object.entries(data)) {
    const name = TABLE_NAMES[table] || table
    lines.push('='.repeat(44))
    lines.push(`【${name}】(${rows.length}条)`)
    lines.push('='.repeat(44))
    if (rows.length === 0) {
      lines.push('(暂无数据)')
      lines.push('')
      continue
    }
    rows.forEach((row, i) => {
      lines.push(...formatRecordLines(i, row))
      lines.push('')
    })
    lines.push('')
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `workbench-全部数据-${dateStr()}.txt`)
}

// 转义 HTML 特殊字符
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 导出全部数据为 Word 文档（HTML 格式 .doc，Word/WPS 可直接打开）
export async function exportAllWord(): Promise<void> {
  const data = await exportAllData()
  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0)
  const parts: string[] = []
  parts.push(`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">`)
  parts.push(`<head><meta charset="utf-8"><title>森系工作台数据导出</title>`)
  parts.push(`<style>
body{font-family:'微软雅黑',SimSun,sans-serif;color:#333;font-size:12pt}
h1{color:#4a8f5c;border-bottom:3px solid #4a8f5c;padding-bottom:8px}
h2{color:#fff;background:#4a8f5c;padding:6px 12px;margin-top:26px;font-size:14pt}
table{border-collapse:collapse;width:100%;margin:8px 0 22px}
th{background:#7dbf8a;color:#fff;padding:5px 8px;border:1px solid #7dbf8a;text-align:left;font-size:10.5pt}
td{padding:5px 8px;border:1px solid #ccc;vertical-align:top;word-break:break-all;font-size:10.5pt}
tr:nth-child(even) td{background:#f5faf6}
.meta{color:#888;font-size:11pt}
.empty{color:#999;font-style:italic}
</style></head><body>`)
  parts.push(`<h1>森系工作台 · 全部数据导出</h1>`)
  parts.push(`<p class="meta">导出时间: ${new Date().toLocaleString('zh-CN')} &nbsp;|&nbsp; 数据类别: ${Object.keys(data).length} 类 &nbsp;|&nbsp; 记录总数: ${total} 条</p>`)

  for (const [table, rows] of Object.entries(data)) {
    const name = TABLE_NAMES[table] || table
    parts.push(`<h2>${name}（${rows.length}条）</h2>`)
    if (rows.length === 0) {
      parts.push(`<p class="empty">（暂无数据）</p>`)
      continue
    }
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r).filter(k => k !== 'user_id'))))
    parts.push(`<table border="1"><tr>`)
    parts.push(headers.map(h => `<th>${escapeHtml(FIELD_NAMES[h] || h)}</th>`).join(''))
    parts.push(`</tr>`)
    for (const row of rows) {
      parts.push(`<tr>` + headers.map(h => {
        const html = escapeHtml(formatFieldValue(h, row[h])).replace(/\n/g, '<br/>')
        return `<td>${html}</td>`
      }).join('') + `</tr>`)
    }
    parts.push(`</table>`)
  }

  parts.push(`</body></html>`)
  const blob = new Blob(['\uFEFF' + parts.join('\n')], { type: 'application/msword' })
  downloadBlob(blob, `workbench-全部数据-${dateStr()}.doc`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
