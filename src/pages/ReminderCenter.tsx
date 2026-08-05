import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { Reminder } from '../types'
import Modal from '../components/Modal'
import { PixelReminderIcon } from '../components/PixelIcon'
import { showLocalNotification } from '../lib/push'

const TYPE_MAP = {
  birthday: { label: '生日提醒', icon: '🎂', color: '#E57373' },
  contact: { label: '定期联系', icon: '📞', color: '#64B5F6' },
  custom: { label: '自定义', icon: '📌', color: '#7DBF8A' },
}

export default function ReminderCenter() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'pending' | 'upcoming' | 'history'>('pending')
  const [showCalendar, setShowCalendar] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'birthday' as Reminder['type'],
    title: '', date: todayStr(), time: '09:00',
    calendar: 'solar', advanceDays: 1, repeat: 'yearly', notes: ''
  })

  const load = async () => {
    const data = await dbGet<Reminder[]>('reminders') as Reminder[]
    const today = new Date()
    const updated = data.map(r => {
      const d = new Date(r.date)
      if (r.status === 'done') return r
      if (d < today && r.status !== 'done') return { ...r, status: 'overdue' as const }
      const advance = new Date(d)
      advance.setDate(advance.getDate() - r.advanceDays)
      if (advance <= today) return { ...r, status: 'upcoming' as const }
      return { ...r, status: 'pending' as const }
    })
    setReminders(updated)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.title || !form.date) return
    if (editingId) {
      await dbUpdate('reminders', editingId, { ...form, status: 'pending' })
    } else {
      await dbInsert('reminders', {
        id: uuid(), ...form, status: 'pending', created_at: now()
      })
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ type: 'birthday', title: '', date: todayStr(), time: '09:00', calendar: 'solar', advanceDays: 1, repeat: 'yearly', notes: '' })
    load()
  }

  const handleEdit = (r: Reminder) => {
    setEditingId(r.id)
    setForm({
      type: r.type, title: r.title, date: r.date, time: r.time,
      calendar: (r as any).calendar || 'solar', advanceDays: r.advanceDays, repeat: r.repeat, notes: r.notes || ''
    })
    setShowForm(true)
  }

  const handleAction = async (r: Reminder, action: 'done' | 'delete') => {
    if (action === 'done') {
      await dbUpdate('reminders', r.id, { status: 'done' })
    } else {
      await dbDelete('reminders', r.id)
    }
    load()
  }

  const filtered = reminders.filter(r => {
    if (tab === 'pending') return r.status === 'pending' || r.status === 'overdue'
    if (tab === 'upcoming') return r.status === 'upcoming'
    return r.status === 'done'
  })

  const pendingCount = reminders.filter(r => r.status === 'pending' || r.status === 'overdue').length
  const upcomingCount = reminders.filter(r => r.status === 'upcoming').length
  const doneCount = reminders.filter(r => r.status === 'done').length

  const currentMonth = new Date()
  const calendarDays = (() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  })()

  const hasReminderOnDay = (day: number | null) => {
    if (!day) return false
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return reminders.some(r => r.date === dateStr)
  }

  const testNotification = () => {
    showLocalNotification('测试通知', '这是一条来自森系工作台的测试提醒!')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelReminderIcon size={28} /> 智能提醒中心</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={testNotification}>测试通知</button>
          <button className="btn btn-outline" onClick={() => setShowCalendar(!showCalendar)}>{showCalendar ? '列表视图' : '日历视图'}</button>
          <button className="btn btn-highlight" onClick={() => { setEditingId(null); setForm({ type: 'birthday', title: '', date: todayStr(), time: '09:00', calendar: 'solar', advanceDays: 1, repeat: 'yearly', notes: '' }); setShowForm(true); }}>+ 新建提醒</button>
        </div>
      </div>

      <div className="grid grid-3 mb-4">
        <div className="card text-center">
          <div className="stat-number" style={{ color: 'var(--color-danger)' }}>{pendingCount}</div>
          <div className="stat-label">待处理</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ color: 'var(--color-warning)' }}>{upcomingCount}</div>
          <div className="stat-label">即将到来</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ color: 'var(--color-success)' }}>{doneCount}</div>
          <div className="stat-label">本月已处理</div>
        </div>
      </div>

      {showCalendar ? (
        <div className="card">
          <div className="card-title">{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-sm text-bold text-light" style={{ padding: '4px 0' }}>{d}</div>
            ))}
            {calendarDays.map((day, i) => (
              <div key={i} style={{
                padding: '6px 4px', borderRadius: 4, fontSize: 12,
                background: hasReminderOnDay(day) ? 'rgba(125,191,138,0.2)' : 'transparent',
                position: 'relative', minHeight: 32
              }}>
                {day}
                {hasReminderOnDay(day) && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, background: 'var(--color-highlight)', borderRadius: '50%' }} />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="tab-bar">
            <button className={`tab-item ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>待处理 ({pendingCount})</button>
            <button className={`tab-item ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>即将到来 ({upcomingCount})</button>
            <button className={`tab-item ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>历史 ({doneCount})</button>
          </div>

          {filtered.length === 0 ? (
            <div className="card empty-state">
              <PixelReminderIcon size={48} />
              <p className="empty-state-text">暂无提醒</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(r => (
                <div key={r.id} className="card" style={{ padding: '12px 16px' }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 24 }}>{TYPE_MAP[r.type].icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-bold">{r.title}</span>
                        <span className={`badge ${r.status === 'overdue' ? 'badge-red' : r.status === 'upcoming' ? 'badge-gold' : 'badge-gray'}`}>
                          {r.status === 'overdue' ? '已逾期' : r.status === 'upcoming' ? '即将到来' : '待处理'}
                        </span>
                      </div>
                      <div className="text-sm text-light">
                        {r.date} {r.time} · {TYPE_MAP[r.type].label}
                        {r.advanceDays > 0 && ` · 提前${r.advanceDays}天`}
                        {r.repeat !== 'none' && ` · ${r.repeat === 'yearly' ? '每年' : r.repeat === 'monthly' ? '每月' : '每周'}`}
                      </div>
                      {r.notes && <div className="text-sm mt-1">{r.notes}</div>}
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(r)}>编辑</button>
                    {r.status !== 'done' && (
                      <button className="btn btn-sm btn-highlight" onClick={() => handleAction(r, 'done')}>完成</button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => handleAction(r, 'delete')}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} title={editingId ? '编辑提醒' : '新建提醒'} onClose={() => { setShowForm(false); setEditingId(null); }}>
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">提醒类型</label>
            <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
              {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">标题</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="如: 张三生日" />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">日期</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">时间</label>
              <input type="time" className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-2">
            {form.type === 'birthday' && (
              <div className="input-group">
                <label className="input-label">历法</label>
                <select className="select" value={form.calendar} onChange={e => setForm({ ...form, calendar: e.target.value })}>
                  <option value="solar">公历</option>
                  <option value="lunar">农历</option>
                </select>
              </div>
            )}
            <div className="input-group">
              <label className="input-label">提前提醒(天)</label>
              <input type="number" className="input" value={form.advanceDays} onChange={e => setForm({ ...form, advanceDays: Number(e.target.value) })} min={0} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">重复</label>
            <select className="select" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
              <option value="none">不重复</option>
              <option value="yearly">每年</option>
              <option value="monthly">每月</option>
              <option value="weekly">每周</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">备注</label>
            <textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleSave}>{editingId ? '保存修改' : '创建提醒'}</button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
