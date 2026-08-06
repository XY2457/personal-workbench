import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { DailyPlan as DailyPlanType } from '../types'
import Modal from '../components/Modal'
import { PixelDailyPlanIcon } from '../components/PixelIcon'

const PRIORITY_MAP = {
  high: { label: '高', color: '#E57373', bg: 'rgba(229,115,115,0.15)' },
  medium: { label: '中', color: '#FFB74D', bg: 'rgba(255,183,77,0.15)' },
  low: { label: '低', color: '#81C784', bg: 'rgba(129,199,132,0.15)' },
}

export default function DailyPlanPage() {
  const [plans, setPlans] = useState<DailyPlanType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [form, setForm] = useState({
    content: '', time: '08:00', priority: 'medium' as DailyPlanType['priority']
  })

  const load = async () => {
    const data = await dbGet<DailyPlanType[]>('dailyplans') as DailyPlanType[]
    setPlans(data.filter(p => p.date === selectedDate).sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] - order[b.priority]) || (a.time || '').localeCompare(b.time || '')
    }))
  }

  useEffect(() => { load() }, [selectedDate])

  const handleSave = async () => {
    if (!form.content) return
    if (editingId) {
      await dbUpdate('dailyplans', editingId, { ...form })
    } else {
      await dbInsert('dailyplans', {
        id: uuid(), ...form, date: selectedDate, done: false, created_at: now()
      })
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ content: '', time: '08:00', priority: 'medium' })
    load()
  }

  const handleEdit = (p: DailyPlanType) => {
    setEditingId(p.id)
    setForm({ content: p.content, time: p.time, priority: p.priority })
    setShowForm(true)
  }

  const toggleDone = async (p: DailyPlanType) => {
    await dbUpdate('dailyplans', p.id, { done: !p.done })
    load()
  }

  const handleDelete = async (id: string) => {
    await dbDelete('dailyplans', id)
    load()
  }

  const now_ = new Date()
  const isToday = selectedDate === todayStr()
  const doneCount = plans.filter(p => p.done).length
  const totalCount = plans.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const yesterday = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }
  const tomorrow = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const dateLabel = isToday
    ? '今天'
    : selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      ? '昨天'
      : selectedDate === new Date(Date.now() + 86400000).toISOString().slice(0, 10)
        ? '明天'
        : selectedDate

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PixelDailyPlanIcon size={28} /> 每日计划
          </h1>
          <p className="page-subtitle">{now_.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <button
          className="btn btn-highlight"
          onClick={() => { setEditingId(null); setForm({ content: '', time: '08:00', priority: 'medium' }); setShowForm(true) }}
        >
          + 添加计划
        </button>
      </div>

      <div className="card mb-3" style={{ padding: '10px 16px' }}>
        <div className="flex items-center justify-between">
          <button className="btn btn-sm btn-outline" onClick={yesterday}>← 前一天</button>
          <div style={{ textAlign: 'center' }}>
            <div className="text-bold" style={{ fontSize: 16 }}>{dateLabel}</div>
            <div className="text-sm text-light">{selectedDate}</div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={tomorrow}>后一天 →</button>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="card mb-3" style={{ padding: '12px 16px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-bold">完成进度</span>
            <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>{doneCount}/{totalCount} ({progress}%)</span>
          </div>
          <div style={{ height: 8, background: 'rgba(125,191,138,0.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--color-secondary)',
              width: `${progress}%`, borderRadius: 4, transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="card empty-state">
          <PixelDailyPlanIcon size={48} />
          <p className="empty-state-text">{isToday ? '今天还没有计划，开始规划吧!' : '这一天没有计划'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {plans.map(p => {
            const pri = PRIORITY_MAP[p.priority]
            return (
              <div key={p.id} className="card" style={{
                padding: '12px 14px',
                opacity: p.done ? 0.55 : 1,
                background: p.done ? 'rgba(125,191,138,0.06)' : undefined
              }}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={p.done}
                    onChange={() => toggleDone(p)}
                    style={{ width: 20, height: 20, accentColor: 'var(--color-secondary)', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div style={{
                      textDecoration: p.done ? 'line-through' : 'none',
                      fontSize: 14, fontWeight: 500, wordBreak: 'break-word'
                    }}>
                      {p.content}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-light">{p.time}</span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: pri.bg, color: pri.color, fontWeight: 600
                      }}>
                        {pri.label}优先级
                      </span>
                    </div>
                  </div>
                  {!p.done && (
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>编辑</button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>删除</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={showForm}
        title={editingId ? '编辑计划' : '添加计划'}
        onClose={() => { setShowForm(false); setEditingId(null) }}
      >
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">计划内容</label>
            <input
              className="input"
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="输入今天的计划..."
            />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">时间</label>
              <input
                type="time"
                className="input"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">优先级</label>
              <select
                className="select"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as DailyPlanType['priority'] })}
              >
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🟢 低</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleSave}>
              {editingId ? '保存修改' : '添加计划'}
            </button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
              取消
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
