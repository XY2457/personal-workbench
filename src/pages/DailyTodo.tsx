import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { DailyTodo as DailyTodoType, SubTask } from '../types'
import Modal from '../components/Modal'
import { PixelDailyTodoIcon } from '../components/PixelIcon'

const CATEGORY_MAP = {
  work: { label: '工作', icon: '💼', color: '#64B5F6', bg: 'rgba(100,181,246,0.12)' },
  study: { label: '学习', icon: '📚', color: '#BA68C8', bg: 'rgba(186,104,200,0.12)' },
  life: { label: '生活', icon: '🌿', color: '#81C784', bg: 'rgba(129,199,132,0.12)' },
  other: { label: '其他', icon: '📌', color: '#FFB74D', bg: 'rgba(255,183,77,0.12)' },
}

const PRIORITY_MAP = {
  high: { label: '高', color: '#E57373', bg: 'rgba(229,115,115,0.15)' },
  medium: { label: '中', color: '#FFB74D', bg: 'rgba(255,183,77,0.15)' },
  low: { label: '低', color: '#81C784', bg: 'rgba(129,199,132,0.15)' },
}

const STATUS_MAP = {
  todo: { label: '待办', color: '#999', bg: 'rgba(153,153,153,0.12)' },
  doing: { label: '进行中', color: '#FFB74D', bg: 'rgba(255,183,77,0.15)' },
  done: { label: '已完成', color: '#81C784', bg: 'rgba(129,199,132,0.12)' },
}

const REPEAT_MAP = {
  none: '不重复',
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
}

type CategoryFilter = 'all' | 'work' | 'study' | 'life' | 'other'
type StatusFilter = 'all' | 'todo' | 'doing' | 'done'

export default function DailyTodo() {
  const [todos, setTodos] = useState<DailyTodoType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchText, setSearchText] = useState('')
  const [showStats, setShowStats] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: 'work' as DailyTodoType['category'],
    priority: 'medium' as DailyTodoType['priority'],
    date: todayStr(),
    startTime: '09:00',
    endTime: '10:00',
    repeat: 'none' as DailyTodoType['repeat'],
    notes: '',
    subTasks: [] as SubTask[],
  })
  const [subTaskInput, setSubTaskInput] = useState('')

  const load = async () => {
    const data = await dbGet<DailyTodoType[]>('daily_todos') as DailyTodoType[]
    const dayTodos = data.filter(t => t.date === selectedDate)
    const order = { high: 0, medium: 1, low: 2 }
    const statusOrder = { todo: 0, doing: 1, done: 2 }
    dayTodos.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
      return (a.startTime || '').localeCompare(b.startTime || '')
    })
    setTodos(dayTodos)
  }

  useEffect(() => { load() }, [selectedDate])

  const handleSave = async () => {
    if (!form.title.trim()) return
    if (editingId) {
      await dbUpdate('daily_todos', editingId, {
        title: form.title,
        category: form.category,
        priority: form.priority,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        repeat: form.repeat,
        notes: form.notes,
        subTasks: form.subTasks,
        updated_at: now(),
      })
    } else {
      await dbInsert('daily_todos', {
        id: uuid(),
        title: form.title,
        category: form.category,
        priority: form.priority,
        status: 'todo' as const,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        repeat: form.repeat,
        notes: form.notes,
        subTasks: form.subTasks,
        created_at: now(),
        updated_at: now(),
      })
    }
    setShowForm(false)
    setEditingId(null)
    resetForm()
    load()
  }

  const resetForm = () => {
    setForm({
      title: '', category: 'work', priority: 'medium', date: selectedDate,
      startTime: '09:00', endTime: '10:00', repeat: 'none', notes: '', subTasks: []
    })
    setSubTaskInput('')
  }

  const handleEdit = (t: DailyTodoType) => {
    setEditingId(t.id)
    setForm({
      title: t.title,
      category: t.category,
      priority: t.priority,
      date: t.date,
      startTime: t.startTime || '09:00',
      endTime: t.endTime || '10:00',
      repeat: t.repeat || 'none',
      notes: t.notes || '',
      subTasks: t.subTasks || [],
    })
    setShowForm(true)
  }

  const cycleStatus = async (t: DailyTodoType) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo'
    await dbUpdate('daily_todos', t.id, { status: next, updated_at: now() })
    load()
  }

  const handleDelete = async (id: string) => {
    await dbDelete('daily_todos', id)
    load()
  }

  const addSubTask = () => {
    if (!subTaskInput.trim()) return
    setForm({
      ...form,
      subTasks: [...form.subTasks, { id: uuid(), content: subTaskInput.trim(), done: false }]
    })
    setSubTaskInput('')
  }

  const toggleSubTask = (id: string) => {
    setForm({
      ...form,
      subTasks: form.subTasks.map(s => s.id === id ? { ...s, done: !s.done } : s)
    })
  }

  const removeSubTask = (id: string) => {
    setForm({ ...form, subTasks: form.subTasks.filter(s => s.id !== id) })
  }

  const toggleTodoSubTask = async (todoId: string, subId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (!todo || !todo.subTasks) return
    const updated = todo.subTasks.map(s => s.id === subId ? { ...s, done: !s.done } : s)
    await dbUpdate('daily_todos', todoId, { subTasks: updated, updated_at: now() })
    load()
  }

  // 日期导航
  const changeDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const isToday = selectedDate === todayStr()
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const dateLabel = isToday ? '今天' : selectedDate === yesterdayStr ? '昨天' : selectedDate === tomorrowStr ? '明天' : selectedDate

  // 统计
  const totalCount = todos.length
  const doneCount = todos.filter(t => t.status === 'done').length
  const doingCount = todos.filter(t => t.status === 'doing').length
  const todoCount = todos.filter(t => t.status === 'todo').length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // 过滤
  const filtered = todos.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (searchText && !t.title.includes(searchText) && !(t.notes || '').includes(searchText)) return false
    return true
  })

  const now_ = new Date()

  return (
    <div>
      {/* 页头 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PixelDailyTodoIcon size={28} /> 每日待办
          </h1>
          <p className="page-subtitle">{now_.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => setShowStats(!showStats)}>
            {showStats ? '收起统计' : '统计'}
          </button>
          <button className="btn btn-highlight" onClick={() => { setEditingId(null); resetForm(); setShowForm(true) }}>
            + 新建待办
          </button>
        </div>
      </div>

      {/* 日期导航 */}
      <div className="card mb-3" style={{ padding: '10px 16px' }}>
        <div className="flex items-center justify-between">
          <button className="btn btn-sm btn-outline" onClick={() => changeDate(-1)}>← 前一天</button>
          <div style={{ textAlign: 'center' }}>
            <div className="text-bold" style={{ fontSize: 16 }}>{dateLabel}</div>
            <div className="text-sm text-light">{selectedDate}</div>
          </div>
          <button className="btn btn-sm btn-outline" onClick={() => changeDate(1)}>后一天 →</button>
        </div>
      </div>

      {/* 统计面板 */}
      {showStats && (
        <div className="grid grid-4 mb-3">
          <div className="card text-center" style={{ padding: '10px 8px' }}>
            <div className="stat-number" style={{ color: 'var(--color-text)', fontSize: 22 }}>{totalCount}</div>
            <div className="stat-label">总任务</div>
          </div>
          <div className="card text-center" style={{ padding: '10px 8px' }}>
            <div className="stat-number" style={{ color: '#999', fontSize: 22 }}>{todoCount}</div>
            <div className="stat-label">待办</div>
          </div>
          <div className="card text-center" style={{ padding: '10px 8px' }}>
            <div className="stat-number" style={{ color: '#FFB74D', fontSize: 22 }}>{doingCount}</div>
            <div className="stat-label">进行中</div>
          </div>
          <div className="card text-center" style={{ padding: '10px 8px' }}>
            <div className="stat-number" style={{ color: '#81C784', fontSize: 22 }}>{doneCount}</div>
            <div className="stat-label">已完成</div>
          </div>
        </div>
      )}

      {/* 进度条 */}
      {totalCount > 0 && (
        <div className="card mb-3" style={{ padding: '12px 16px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-bold">今日进度</span>
            <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>{doneCount}/{totalCount} ({progress}%)</span>
          </div>
          <div style={{ height: 8, background: 'rgba(125,191,138,0.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #81C784, #7DBF8A)',
              width: `${progress}%`, borderRadius: 4, transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="mb-3">
        <input
          className="input"
          placeholder="搜索待办标题或备注..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* 分类筛选 */}
      <div className="tab-bar mb-3">
        <button className={`tab-item ${categoryFilter === 'all' ? 'active' : ''}`} onClick={() => setCategoryFilter('all')}>全部</button>
        {Object.entries(CATEGORY_MAP).map(([k, v]) => (
          <button key={k} className={`tab-item ${categoryFilter === k ? 'active' : ''}`} onClick={() => setCategoryFilter(k as CategoryFilter)}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
        {(['all', 'todo', 'doing', 'done'] as StatusFilter[]).map(s => (
          <button
            key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? '全部状态' : STATUS_MAP[s].label}
          </button>
        ))}
      </div>

      {/* 待办列表 */}
      {filtered.length === 0 ? (
        <div className="card empty-state">
          <PixelDailyTodoIcon size={48} />
          <p className="empty-state-text">
            {totalCount === 0
              ? (isToday ? '今天还没有待办，开始添加吧!' : '这一天没有待办')
              : '没有符合条件的待办'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(t => {
            const cat = CATEGORY_MAP[t.category]
            const pri = PRIORITY_MAP[t.priority]
            const st = STATUS_MAP[t.status]
            const subDone = (t.subTasks || []).filter(s => s.done).length
            const subTotal = (t.subTasks || []).length
            return (
              <div key={t.id} className="card" style={{
                padding: '12px 14px',
                opacity: t.status === 'done' ? 0.6 : 1,
                borderLeft: `3px solid ${cat.color}`,
              }}>
                <div className="flex items-start gap-3">
                  {/* 状态切换按钮 */}
                  <button
                    onClick={() => cycleStatus(t)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                      borderColor: t.status === 'done' ? '#81C784' : t.status === 'doing' ? '#FFB74D' : '#ccc',
                      background: t.status === 'done' ? '#81C784' : t.status === 'doing' ? 'rgba(255,183,77,0.2)' : 'transparent',
                      cursor: 'pointer', flexShrink: 0, marginTop: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#fff',
                    }}
                  >
                    {t.status === 'done' ? '✓' : t.status === 'doing' ? '●' : ''}
                  </button>

                  <div className="flex-1" style={{ minWidth: 0 }}>
                    {/* 标题行 */}
                    <div style={{
                      fontSize: 14, fontWeight: 500, wordBreak: 'break-word',
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    }}>
                      {t.title}
                    </div>

                    {/* 标签行 */}
                    <div className="flex items-center gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: cat.bg, color: cat.color, fontWeight: 600
                      }}>
                        {cat.icon} {cat.label}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: pri.bg, color: pri.color, fontWeight: 600
                      }}>
                        {pri.label}优先级
                      </span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 4,
                        background: st.bg, color: st.color, fontWeight: 600
                      }}>
                        {st.label}
                      </span>
                    </div>

                    {/* 时间+重复 */}
                    <div className="text-sm text-light mt-1" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {t.startTime && (
                        <span>⏰ {t.startTime}{t.endTime ? ` - ${t.endTime}` : ''}</span>
                      )}
                      {t.repeat && t.repeat !== 'none' && (
                        <span>🔁 {REPEAT_MAP[t.repeat]}</span>
                      )}
                      {subTotal > 0 && (
                        <span>📋 {subDone}/{subTotal}</span>
                      )}
                    </div>

                    {/* 备注 */}
                    {t.notes && (
                      <div className="text-sm mt-1" style={{ color: 'rgba(0,0,0,0.5)', wordBreak: 'break-word' }}>
                        📝 {t.notes}
                      </div>
                    )}

                    {/* 子任务列表（紧凑展示） */}
                    {subTotal > 0 && (
                      <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {t.subTasks.map(s => (
                          <div key={s.id} className="flex items-center gap-2" style={{ fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={s.done}
                              onChange={() => toggleTodoSubTask(t.id, s.id)}
                              style={{ width: 14, height: 14, accentColor: 'var(--color-secondary)', cursor: 'pointer' }}
                            />
                            <span style={{
                              textDecoration: s.done ? 'line-through' : 'none',
                              color: s.done ? '#999' : 'inherit',
                            }}>
                              {s.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-1" style={{ flexShrink: 0 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(t)} style={{ fontSize: 11, padding: '2px 8px' }}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)} style={{ fontSize: 11, padding: '2px 8px' }}>删除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      <Modal
        open={showForm}
        title={editingId ? '编辑待办' : '新建待办'}
        onClose={() => { setShowForm(false); setEditingId(null) }}
        maxWidth={520}
      >
        <div className="flex flex-col gap-3">
          {/* 标题 */}
          <div className="input-group">
            <label className="input-label">待办标题 *</label>
            <input
              className="input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="输入待办内容..."
            />
          </div>

          {/* 分类 + 优先级 */}
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">分类</label>
              <select
                className="select"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as DailyTodoType['category'] })}
              >
                {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">优先级</label>
              <select
                className="select"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as DailyTodoType['priority'] })}
              >
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🟢 低</option>
              </select>
            </div>
          </div>

          {/* 日期 + 重复 */}
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">日期</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">重复</label>
              <select
                className="select"
                value={form.repeat}
                onChange={e => setForm({ ...form, repeat: e.target.value as DailyTodoType['repeat'] })}
              >
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
          </div>

          {/* 时间段 */}
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">开始时间</label>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label className="input-label">结束时间</label>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="input-group">
            <label className="input-label">备注</label>
            <textarea
              className="textarea"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="补充说明..."
              rows={2}
            />
          </div>

          {/* 子任务 */}
          <div className="input-group">
            <label className="input-label">子任务 ({form.subTasks.length})</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input"
                value={subTaskInput}
                onChange={e => setSubTaskInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubTask() } }}
                placeholder="输入子任务后按回车..."
                style={{ flex: 1 }}
              />
              <button className="btn btn-outline btn-sm" onClick={addSubTask}>添加</button>
            </div>
            {form.subTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {form.subTasks.map(s => (
                  <div key={s.id} className="flex items-center gap-2" style={{
                    padding: '4px 8px', borderRadius: 6,
                    background: s.done ? 'rgba(125,191,138,0.08)' : 'rgba(255,255,255,0.5)',
                  }}>
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSubTask(s.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-secondary)', cursor: 'pointer' }}
                    />
                    <span style={{
                      flex: 1, fontSize: 13,
                      textDecoration: s.done ? 'line-through' : 'none',
                      color: s.done ? '#999' : 'inherit',
                    }}>
                      {s.content}
                    </span>
                    <button
                      onClick={() => removeSubTask(s.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#E57373', fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleSave}>
              {editingId ? '保存修改' : '创建待办'}
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
