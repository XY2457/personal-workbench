import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  }
  return client
}

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

// 获取或创建用户ID (匿名用户)
export function getUserId(): string {
  let uid = localStorage.getItem('workbench_user_id')
  if (!uid) {
    uid = 'local_' + crypto.randomUUID()
    localStorage.setItem('workbench_user_id', uid)
  }
  return uid
}
