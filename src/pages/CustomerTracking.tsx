import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now } from '../lib/db'
import type { Customer } from '../types'
import Modal from '../components/Modal'
import { PixelCustomerIcon } from '../components/PixelIcon'

const STATUS_MAP = {
  potential: { label: '潜在', badge: 'badge-gray' },
  following: { label: '跟进中', badge: 'badge-blue' },
  signed: { label: '已签约', badge: 'badge-green' },
  lost: { label: '已流失', badge: 'badge-red' },
}

export default function CustomerTracking() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState({ name: '', company: '', phone: '', status: 'potential', notes: '' })

  const load = async () => {
    const data = await dbGet<Customer[]>('customers') as Customer[]
    setCustomers(data.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name) return
    if (editing) {
      await dbUpdate('customers', editing.id, { ...form })
    } else {
      await dbInsert('customers', { id: uuid(), ...form, lastContact: new Date().toISOString(), created_at: now() })
    }
    setShowForm(false); setEditing(null)
    setForm({ name: '', company: '', phone: '', status: 'potential', notes: '' })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该客户?')) return
    await dbDelete('customers', id)
    load()
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, company: c.company, phone: c.phone, status: c.status, notes: c.notes })
    setShowForm(true)
  }

  const filtered = filter === 'all' ? customers : customers.filter(c => c.status === filter)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelCustomerIcon size={28} /> 客户跟踪</h1>
        <button className="btn btn-highlight" onClick={() => { setEditing(null); setForm({ name: '', company: '', phone: '', status: 'potential', notes: '' }); setShowForm(true) }}>
          + 新增客户
        </button>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>全部 ({customers.length})</button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button key={k} className={`tab-item ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {v.label} ({customers.filter(c => c.status === k).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <PixelCustomerIcon size={48} />
          <p className="empty-state-text">暂无客户记录</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filtered.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-lg text-bold">{c.name}</span>
                  {c.company && <span className="text-sm text-light ml-2">{c.company}</span>}
                </div>
                <span className={`badge ${STATUS_MAP[c.status].badge}`}>{STATUS_MAP[c.status].label}</span>
              </div>
              <div className="text-sm text-light">{c.phone || '未填写电话'}</div>
              {c.notes && <div className="text-sm mt-2" style={{ color: 'var(--color-text)' }}>{c.notes}</div>}
              <div className="flex gap-2 mt-3">
                <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)}>编辑</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} title={editing ? '编辑客户' : '新增客户'} onClose={() => setShowForm(false)}>
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">姓名 *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">公司</label>
              <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">电话</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">状态</label>
            <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">备注</label>
            <textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleSave}>{editing ? '保存' : '添加'}</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>取消</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
