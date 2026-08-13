import { isSupabaseConfigured, getSupabase, getUserId } from './supabase'

/**
 * 数据层 - 自动选择 Supabase 或 localStorage
 * Supabase 配置后自动切换到云端，否则使用本地存储
 */

const DB_PREFIX = 'workbench_'

// ===== 通用存储 =====
export async function dbGet<T>(table: string, id?: string): Promise<T | T[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabase()!
    const uid = getUserId()
    let query = sb.from(table).select('*').eq('user_id', uid)
    if (id) query = query.eq('id', id).single()
    const { data, error } = await query
    if (error) throw error
    return data as T | T[]
  }
  // localStorage fallback
  const key = DB_PREFIX + table
  const raw = localStorage.getItem(key)
  const all = raw ? JSON.parse(raw) : []
  if (id) return all.find((r: any) => r.id === id) as T
  return all as T[]
}

export async function dbInsert<T extends Record<string, any>>(table: string, record: T): Promise<T> {
  const uid = getUserId()
  const recordWithUser = { ...record, user_id: uid }
  if (isSupabaseConfigured()) {
    const sb = getSupabase()!
    const { data, error } = await sb.from(table).insert(recordWithUser).select().single()
    if (error) throw error
    return data as T
  }
  const key = DB_PREFIX + table
  const raw = localStorage.getItem(key)
  const all = raw ? JSON.parse(raw) : []
  all.push(recordWithUser)
  localStorage.setItem(key, JSON.stringify(all))
  return recordWithUser as T
}

export async function dbUpdate<T extends Record<string, any>>(table: string, id: string, updates: Partial<T>): Promise<T> {
  if (isSupabaseConfigured()) {
    const sb = getSupabase()!
    const { data, error } = await sb.from(table).update(updates).eq('id', id).select().single()
    if (error) throw error
    return data as T
  }
  const key = DB_PREFIX + table
  const raw = localStorage.getItem(key)
  const all = raw ? JSON.parse(raw) : []
  const idx = all.findIndex((r: any) => r.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates }
    localStorage.setItem(key, JSON.stringify(all))
    return all[idx] as T
  }
  throw new Error('Record not found')
}

export async function dbDelete(table: string, id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabase()!
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) throw error
    return
  }
  const key = DB_PREFIX + table
  const raw = localStorage.getItem(key)
  const all = raw ? JSON.parse(raw) : []
  const filtered = all.filter((r: any) => r.id !== id)
  localStorage.setItem(key, JSON.stringify(filtered))
}

// ===== 文件上传 =====
export async function uploadFile(file: File | Blob, path: string): Promise<string> {
  if (isSupabaseConfigured()) {
    const sb = getSupabase()!
    const uid = getUserId()
    const fullPath = `${uid}/${path}`
    const { data, error } = await sb.storage.from('photos').upload(fullPath, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = sb.storage.from('photos').getPublicUrl(fullPath)
    return urlData.publicUrl
  }
  // localStorage fallback - base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ===== 导出全部数据 =====
export async function exportAllData(): Promise<Record<string, any[]>> {
  const tables = [
    'todos', 'dailyplans', 'daily_todos', 'customers', 'reminders', 'inspirations', 'excerpts',
    'daily_notes', 'words', 'growth_metrics', 'milestones', 'growth_diaries',
    'memos', 'expenses', 'fixed_expenses', 'shopping_items', 'wish_items', 'accounts'
  ]
  const result: Record<string, any[]> = {}
  for (const table of tables) {
    try {
      const data = await dbGet<any[]>(table)
      result[table] = data as any[]
    } catch {
      result[table] = []
    }
  }
  return result
}

// ===== 生成 UUID =====
export function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// ===== 当前日期时间 =====
export function now(): string {
  return new Date().toISOString()
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}
