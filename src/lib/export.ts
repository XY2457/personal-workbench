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
