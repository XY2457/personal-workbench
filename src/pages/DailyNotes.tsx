import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { DailyNote } from '../types'
import { PixelNoteIcon, PixelLeaf } from '../components/PixelIcon'
import PhotoUpload from '../components/PhotoUpload'

const MOODS = [
  { key: 'great', emoji: '😄', label: '超棒' },
  { key: 'good', emoji: '🙂', label: '不错' },
  { key: 'ok', emoji: '😐', label: '一般' },
  { key: 'sad', emoji: '😟', label: '低落' },
  { key: 'angry', emoji: '😤', label: '烦躁' },
]

export default function DailyNotes() {
  const [notes, setNotes] = useState<DailyNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('good')
  const [photos, setPhotos] = useState<string[]>([])

  const load = async () => {
    const data = await dbGet<DailyNote[]>('daily_notes') as DailyNote[]
    setNotes(data.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!content) return
    await dbInsert('daily_notes', {
      id: uuid(), content, mood, photos, date: todayStr(), created_at: now()
    })
    setShowForm(false)
    setContent(''); setMood('good'); setPhotos([])
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除?')) return
    await dbDelete('daily_notes', id)
    load()
  }

  const getMoodEmoji = (key: string) => MOODS.find(m => m.key === key)?.emoji || '📝'

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelNoteIcon size={28} /> 每日随手记 & 反思</h1>
        <button className="btn btn-highlight" onClick={() => setShowForm(true)}>+ 写一条</button>
      </div>

      {/* 今日提示 */}
      <div className="card mb-4" style={{ background: 'rgba(125,191,138,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <PixelLeaf size={32} />
        <div>
          <div className="text-bold text-primary">今日反思</div>
          <div className="text-sm text-light">每天花5分钟记录感悟，积少成多，成长看得见</div>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="card empty-state">
          <PixelNoteIcon size={48} />
          <p className="empty-state-text">还没有随手记，开始记录今天的感悟吧!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <div key={note.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 24 }}>{getMoodEmoji(note.mood)}</span>
                  <div>
                    <div className="text-bold">{note.date}</div>
                    <div className="text-sm text-light">{MOODS.find(m => m.key === note.mood)?.label}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note.id)}>删除</button>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{note.content}</div>
              {note.photos.length > 0 && (
                <div className="photo-grid mt-2">
                  {note.photos.map((p, i) => (
                    <div key={i} className="photo-grid-item"><img src={p} alt="" /></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">写一条随手记</span>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="input-group">
                <label className="input-label">心情</label>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button key={m.key} onClick={() => setMood(m.key)} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      border: mood === m.key ? '2px solid var(--color-secondary)' : '1.5px solid var(--color-border)',
                      background: mood === m.key ? 'rgba(125,191,138,0.15)' : 'transparent',
                      cursor: 'pointer', fontSize: 20, fontFamily: 'var(--font-main)'
                    }}>
                      {m.emoji} <span style={{ fontSize: 12 }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">内容</label>
                <textarea className="textarea" style={{ minHeight: 150 }} value={content} onChange={e => setContent(e.target.value)} placeholder="记录今天的感悟、反思、发现..." />
              </div>
              <div className="input-group">
                <label className="input-label">照片</label>
                <PhotoUpload photos={photos} onChange={setPhotos} max={9} />
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary flex-1" onClick={handleSave}>保存</button>
                <button className="btn btn-outline" onClick={() => setShowForm(false)}>取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
