import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { Todo, PageId } from '../types'
import Modal from '../components/Modal'
import { PixelTodayIcon, PixelLeaf } from '../components/PixelIcon'

interface Props {
  onNavigate: (page: PageId) => void
}

export default function TodayHub({ onNavigate }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [formData, setFormData] = useState({ content: '', date: todayStr(), time: '09:00' })
  const [todayExpense, setTodayExpense] = useState(0)
  const [accounts, setAccounts] = useState({ daily: 0, fixed: 0, income: 0 })
  const [customers, setCustomers] = useState<any[]>([])

  const loadData = async () => {
    const today = todayStr()
    const allTodos = await dbGet<Todo[]>('todos') as Todo[]
    setTodos(allTodos.filter(t => t.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || '')))

    const expenses = await dbGet<any[]>('expenses') as any[]
    const todayExp = expenses.filter(e => e.date === today && e.type === 'variable')
    setTodayExpense(todayExp.reduce((s, e) => s + Number(e.amount), 0))

    const dailyTotal = expenses.filter(e => e.type === 'variable' && e.date.startsWith(today.slice(0, 7)))
      .reduce((s, e) => s + Number(e.amount), 0)
    const daysInMonth = new Date().getDate()
    const monthlyLimit = daysInMonth * 50
    setAccounts({
      daily: Math.max(0, monthlyLimit - dailyTotal),
      fixed: expenses.filter(e => e.type === 'fixed').reduce((s, e) => s + Number(e.amount), 0),
      income: expenses.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
    })

    const custs = await dbGet<any[]>('customers') as any[]
    setCustomers(custs.slice(0, 5))
  }

  useEffect(() => { loadData() }, [])

  const handleAdd = async () => {
    if (!formData.content) return
    await dbInsert('todos', {
      id: uuid(), content: formData.content, date: formData.date,
      time: formData.time, done: false, created_at: now()
    })
    setShowAdd(false)
    setFormData({ content: '', date: todayStr(), time: '09:00' })
    loadData()
  }

  const handleEdit = async () => {
    if (!editingTodo || !formData.content) return
    await dbUpdate('todos', editingTodo.id, {
      content: formData.content, date: formData.date, time: formData.time
    })
    setEditingTodo(null)
    setFormData({ content: '', date: todayStr(), time: '09:00' })
    loadData()
  }

  const toggleDone = async (todo: Todo) => {
    await dbUpdate('todos', todo.id, { done: !todo.done })
    loadData()
  }

  const deleteTodo = async (id: string) => {
    await dbDelete('todos', id)
    loadData()
  }

  const openEdit = (todo: Todo) => {
    if (todo.done) return
    setEditingTodo(todo)
    setFormData({ content: todo.content, date: todo.date, time: todo.time })
  }

  const now_ = new Date()
  const daysInMonth = new Date(now_.getFullYear(), now_.getMonth() + 1, 0).getDate()
  const currentDay = now_.getDate()
  const monthlyLimit = currentDay * 50

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PixelTodayIcon size={28} /> 今日中枢
          </h1>
          <p className="page-subtitle">{now_.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
        <button className="btn btn-highlight" onClick={() => { setFormData({ content: '', date: todayStr(), time: '09:00' }); setShowAdd(true) }}>
          + 添加待办
        </button>
      </div>

      {/* 五账户速览 */}
      <div className="grid grid-3 mb-4">
        <div className="card">
          <div className="card-title"><PixelLeaf size={16} /> 日常账户</div>
          <div className="stat-number" style={{ color: 'var(--color-moss)' }}>¥{accounts.daily.toFixed(0)}</div>
          <div className="stat-label">本月额度 ¥{monthlyLimit} (日×50)</div>
        </div>
        <div className="card">
          <div className="card-title">固定支出</div>
          <div className="stat-number" style={{ color: 'var(--color-warning)' }}>¥{accounts.fixed.toFixed(0)}</div>
          <div className="stat-label">本月已扣固定支出</div>
        </div>
        <div className="card">
          <div className="card-title">收入</div>
          <div className="stat-number" style={{ color: 'var(--color-success)' }}>¥{accounts.income.toFixed(0)}</div>
          <div className="stat-label">本月总收入</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* 待办列表 */}
        <div className="card">
          <div className="card-title">
            <PixelTodayIcon size={20} /> 今日待办
            <span className="badge badge-green ml-auto">{todos.filter(t => !t.done).length} 待完成</span>
          </div>
          {todos.length === 0 ? (
            <div className="empty-state">
              <PixelLeaf size={48} />
              <p className="empty-state-text">今天还没有待办，添加一个吧!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-2" style={{
                  padding: '8px 10px', borderRadius: 'var(--radius-md)',
                  background: todo.done ? 'rgba(125,191,138,0.1)' : 'rgba(255,255,255,0.6)',
                  opacity: todo.done ? 0.6 : 1
                }}>
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleDone(todo)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-secondary)', cursor: 'pointer' }}
                  />
                  <div className="flex-1">
                    <div style={{ textDecoration: todo.done ? 'line-through' : 'none', fontSize: 13, fontWeight: todo.done ? 400 : 500 }}>
                      {todo.content}
                    </div>
                    <div className="text-sm text-light">{todo.time}</div>
                  </div>
                  {!todo.done && (
                    <button className="btn btn-sm btn-outline" onClick={() => openEdit(todo)}>编辑</button>
                  )}
                  {todo.done && (
                    <span className="badge badge-gray">已锁定</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧信息 */}
        <div className="flex flex-col gap-4">
          {/* 今日开销 */}
          <div className="card">
            <div className="card-title">今日开销速览</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="stat-number" style={{ color: 'var(--color-danger)' }}>¥{todayExpense.toFixed(2)}</div>
                <div className="stat-label">今日可变支出合计</div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => onNavigate('wealth')}>去记账</button>
            </div>
          </div>

          {/* 客户一览 */}
          <div className="card">
            <div className="card-title">
              客户情况一览
              <button className="btn btn-sm btn-outline ml-auto" onClick={() => onNavigate('customers')}>全部</button>
            </div>
            {customers.length === 0 ? (
              <div className="empty-state-text">暂无客户记录</div>
            ) : (
              <div className="flex flex-col gap-1">
                {customers.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm" style={{ padding: '4px 0' }}>
                    <span>{c.name}</span>
                    <span className={`badge ${c.status === 'signed' ? 'badge-green' : c.status === 'following' ? 'badge-blue' : 'badge-gray'}`}>
                      {c.status === 'signed' ? '已签约' : c.status === 'following' ? '跟进中' : c.status === 'potential' ? '潜在' : '已流失'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加/编辑待办模态框 */}
      <Modal open={showAdd || !!editingTodo} title={editingTodo ? '编辑待办' : '添加待办'} onClose={() => { setShowAdd(false); setEditingTodo(null) }}>
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">内容</label>
            <input className="input" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="输入待办内容..." />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">日期</label>
              <input type="date" className="input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">时间</label>
              <input type="time" className="input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={editingTodo ? handleEdit : handleAdd}>
              {editingTodo ? '保存修改' : '添加'}
            </button>
            <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditingTodo(null) }}>取消</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
