import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbDelete, uuid, now } from '../lib/db'
import type { Inspiration, Excerpt } from '../types'
import Modal from '../components/Modal'
import { PixelInspirationIcon, PixelLeaf } from '../components/PixelIcon'
import { exportTableTXT } from '../lib/export'

const CATEGORIES = {
  book: { label: '好书推荐', icon: '📚', color: '#5A7A4A' },
  quote: { label: '经典名句', icon: '💬', color: '#7DBF8A' },
  movie: { label: '电影推荐', icon: '🎬', color: '#64B5F6' },
  knowledge: { label: '知识解读', icon: '🔬', color: '#D4A03A' },
  finance: { label: '理财串珠', icon: '💰', color: '#E57373' },
  excerpt: { label: '好词好句摘抄', icon: '✏️', color: '#F48FB1' },
}

const EXCERPT_CATEGORIES = {
  motivational: '励志', philosophy: '哲思', love: '爱情', poetry: '古诗词', life: '生活'
}

export default function InspirationPage() {
  const [tab, setTab] = useState<keyof typeof CATEGORIES>('book')
  const [items, setItems] = useState<Inspiration[]>([])
  const [excerpts, setExcerpts] = useState<Excerpt[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showExcerptForm, setShowExcerptForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', source: '', sourceUrl: '', imageUrl: '', tags: '' })
  const [excerptForm, setExcerptForm] = useState({ text: '', author: '', category: 'motivational' as keyof typeof EXCERPT_CATEGORIES })
  const [excerptFilter, setExcerptFilter] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  const load = async () => {
    const data = await dbGet<Inspiration[]>('inspirations') as Inspiration[]
    setItems(data.sort((a, b) => b.created_at.localeCompare(a.created_at)))
    const exc = await dbGet<Excerpt[]>('excerpts') as Excerpt[]
    setExcerpts(exc.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title) return
    await dbInsert('inspirations', {
      id: uuid(), category: tab, title: form.title, content: form.content,
      source: form.source, sourceUrl: form.sourceUrl, imageUrl: form.imageUrl,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      created_at: now()
    })
    setShowAdd(false)
    setForm({ title: '', content: '', source: '', sourceUrl: '', imageUrl: '', tags: '' })
    load()
  }

  const handleAddExcerpt = async () => {
    if (!excerptForm.text) return
    await dbInsert('excerpts', {
      id: uuid(), text: excerptForm.text, author: excerptForm.author,
      category: excerptForm.category, created_at: now()
    })
    setShowExcerptForm(false)
    setExcerptForm({ text: '', author: '', category: 'motivational' })
    load()
  }

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('确认删除?')) return
    await dbDelete(table, id)
    load()
  }

  const filteredItems = items.filter(i => i.category === tab)
  const filteredExcerpts = excerpts.filter(e => {
    if (excerptFilter !== 'all' && e.category !== excerptFilter) return false
    if (searchKeyword && !e.text.includes(searchKeyword) && !e.author.includes(searchKeyword)) return false
    return true
  })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelInspirationIcon size={28} /> 灵感补给站</h1>
        {tab === 'excerpt' ? (
          <button className="btn btn-highlight" onClick={() => setShowExcerptForm(true)}>+ 添加摘抄</button>
        ) : (
          <button className="btn btn-highlight" onClick={() => setShowAdd(true)}>+ 添加内容</button>
        )}
      </div>

      <div className="tab-bar">
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button key={k} className={`tab-item ${tab === k ? 'active' : ''}`} onClick={() => setTab(k as any)}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {tab === 'excerpt' ? (
        <div>
          {/* 摘抄筛选与搜索 */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select className="select" style={{ width: 'auto' }} value={excerptFilter} onChange={e => setExcerptFilter(e.target.value)}>
              <option value="all">全部分类</option>
              {Object.entries(EXCERPT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input className="input" style={{ flex: 1, minWidth: 150 }} placeholder="搜索关键词..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} />
            <button className="btn btn-outline" onClick={() => exportTableTXT('excerpts', filteredExcerpts)}>导出TXT</button>
          </div>

          {filteredExcerpts.length === 0 ? (
            <div className="card empty-state">
              <PixelLeaf size={48} />
              <p className="empty-state-text">暂无摘抄</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredExcerpts.map(e => (
                <div key={e.id} className="card" style={{ padding: '12px 16px', borderLeft: `3px solid ${CATEGORIES.excerpt.color}` }}>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>{e.text}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-light">
                      {e.author && `—— ${e.author} `}
                      <span className="badge badge-green">{EXCERPT_CATEGORIES[e.category]}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id, 'excerpts')}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredItems.length === 0 ? (
            <div className="card empty-state">
              <PixelInspirationIcon size={48} />
              <p className="empty-state-text">暂无{CATEGORIES[tab].label}内容</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredItems.map(item => (
                <div key={item.id} className="card">
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg text-bold mb-1">{item.title}</h3>
                      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-text)' }}>{item.content}</div>
                      {item.source && <div className="text-sm text-light mt-2">来源: {item.source}</div>}
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.tags.map((t, i) => <span key={i} className="badge badge-green">{t}</span>)}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {item.sourceUrl && (
                          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">阅读原文</a>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id, 'inspirations')}>删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加内容 */}
      <Modal open={showAdd} title={`添加${CATEGORIES[tab].label}`} onClose={() => setShowAdd(false)}>
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">标题</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">正文</label>
            <textarea className="textarea" style={{ minHeight: 120 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">来源</label>
              <input className="input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">配图URL</label>
              <input className="input" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="自动抓取或手动输入" />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">原文链接</label>
            <input className="input" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group">
            <label className="input-label">标签 (逗号分隔)</label>
            <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="如: 成长, 思维" />
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleAdd}>添加</button>
            <button className="btn btn-outline" onClick={() => setShowAdd(false)}>取消</button>
          </div>
        </div>
      </Modal>

      {/* 添加摘抄 */}
      <Modal open={showExcerptForm} title="添加摘抄" onClose={() => setShowExcerptForm(false)}>
        <div className="flex flex-col gap-3">
          <div className="input-group">
            <label className="input-label">内容</label>
            <textarea className="textarea" style={{ minHeight: 100 }} value={excerptForm.text} onChange={e => setExcerptForm({ ...excerptForm, text: e.target.value })} />
          </div>
          <div className="grid grid-2">
            <div className="input-group">
              <label className="input-label">出处/作者</label>
              <input className="input" value={excerptForm.author} onChange={e => setExcerptForm({ ...excerptForm, author: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">分类</label>
              <select className="select" value={excerptForm.category} onChange={e => setExcerptForm({ ...excerptForm, category: e.target.value as any })}>
                {Object.entries(EXCERPT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary flex-1" onClick={handleAddExcerpt}>添加</button>
            <button className="btn btn-outline" onClick={() => setShowExcerptForm(false)}>取消</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
