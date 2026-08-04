import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { ChildInfo, GrowthMetric, Milestone, GrowthDiary, Memo } from '../types'
import { PixelChildIcon, PixelLeaf } from '../components/PixelIcon'
import PhotoUpload from '../components/PhotoUpload'
import DrawingBoard from '../components/DrawingBoard'
import { LineChart } from '../components/Charts'

const MOODS = [
  { key: 'happy', emoji: '😊', label: '开心' },
  { key: 'laugh', emoji: '😂', label: '大笑' },
  { key: 'play', emoji: '🎮', label: '玩耍' },
  { key: 'sleep', emoji: '😴', label: '睡觉' },
  { key: 'cry', emoji: '😢', label: '哭闹' },
  { key: 'eat', emoji: '🍼', label: '吃奶' },
  { key: 'sick', emoji: '🤒', label: '生病' },
  { key: 'learn', emoji: '📚', label: '学习' },
]

const MILESTONE_ICONS = [
  { key: 'first-smile', emoji: '😊', label: '第一次笑' },
  { key: 'roll-over', emoji: '🔄', label: '翻身' },
  { key: 'crawl', emoji: '🐣', label: '会爬' },
  { key: 'sit', emoji: '🧘', label: '会坐' },
  { key: 'stand', emoji: '🧍', label: '站立' },
  { key: 'walk', emoji: '🚶', label: '走路' },
  { key: 'talk', emoji: '💬', label: '第一次叫爸妈' },
  { key: 'tooth', emoji: '🦷', label: '长牙' },
  { key: 'school', emoji: '🏫', label: '上学' },
  { key: 'other', emoji: '🌟', label: '其他' },
]

const GENDER_OPTIONS = { boy: '男孩', girl: '女孩' }

const MEMO_CATEGORIES = {
  work: { label: '工作', color: '#64B5F6' },
  study: { label: '学习', color: '#7DBF8A' },
  life: { label: '生活', color: '#D4A03A' },
  inspiration: { label: '灵感', color: '#F48FB1' },
  other: { label: '其他', color: '#9E9E9E' },
}

export default function TimeCapsule() {
  const [tab, setTab] = useState<'diary' | 'metrics' | 'milestones' | 'memo'>('diary')
  const [childInfo, setChildInfo] = useState<ChildInfo>(() => {
    const saved = localStorage.getItem('child_info')
    return saved ? JSON.parse(saved) : { name: '', gender: 'boy', birthDate: '' }
  })
  const [metrics, setMetrics] = useState<GrowthMetric[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [diaries, setDiaries] = useState<GrowthDiary[]>([])
  const [memos, setMemos] = useState<Memo[]>([])

  const [showChildForm, setShowChildForm] = useState(!childInfo.birthDate)
  const [showMetricForm, setShowMetricForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [showMemoForm, setShowMemoForm] = useState(false)
  const [showDrawing, setShowDrawing] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)

  // 表单状态
  const [diaryForm, setDiaryForm] = useState({ content: '', mood: 'happy', photos: [] as string[] })
  const [metricForm, setMetricForm] = useState({ date: todayStr(), height: '', weight: '', note: '' })
  const [milestoneForm, setMilestoneForm] = useState({ title: '', date: todayStr(), description: '', icon: 'other', photos: [] as string[] })
  const [memoForm, setMemoForm] = useState({ title: '', content: '', category: 'life' as keyof typeof MEMO_CATEGORIES, photos: [] as string[], tags: '', pinned: false })

  const load = async () => {
    const mData = await dbGet<GrowthMetric[]>('growth_metrics') as GrowthMetric[]
    setMetrics(mData.sort((a, b) => a.date.localeCompare(b.date)))
    const msData = await dbGet<Milestone[]>('milestones') as Milestone[]
    setMilestones(msData.sort((a, b) => b.date.localeCompare(a.date)))
    const dData = await dbGet<GrowthDiary[]>('growth_diaries') as GrowthDiary[]
    setDiaries(dData.sort((a, b) => b.created_at.localeCompare(a.created_at)))
    const memoData = await dbGet<Memo[]>('memos') as Memo[]
    setMemos(memoData.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updated_at.localeCompare(a.updated_at)
    }))
  }

  useEffect(() => { load() }, [])

  // 年龄计算
  const calcAge = () => {
    if (!childInfo.birthDate) return { years: 0, months: 0, days: 0, totalDays: 0 }
    const birth = new Date(childInfo.birthDate)
    const now = new Date()
    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    let days = now.getDate() - birth.getDate()
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }
    return { years, months, days, totalDays }
  }

  const age = calcAge()

  const saveChildInfo = () => {
    if (!childInfo.name || !childInfo.birthDate) return
    localStorage.setItem('child_info', JSON.stringify(childInfo))
    setShowChildForm(false)
  }

  const saveMetric = async () => {
    const h = parseFloat(metricForm.height), w = parseFloat(metricForm.weight)
    if (!h && !w) return
    await dbInsert('growth_metrics', { id: uuid(), date: metricForm.date, height: h || 0, weight: w || 0, note: metricForm.note, created_at: now() })
    setShowMetricForm(false)
    setMetricForm({ date: todayStr(), height: '', weight: '', note: '' })
    load()
  }

  const saveMilestone = async () => {
    if (!milestoneForm.title && !milestoneForm.description) return
    await dbInsert('milestones', { id: uuid(), ...milestoneForm, created_at: now() })
    setShowMilestoneForm(false)
    setMilestoneForm({ title: '', date: todayStr(), description: '', icon: 'other', photos: [] })
    load()
  }

  const saveDiary = async () => {
    if (!diaryForm.content) return
    await dbInsert('growth_diaries', { id: uuid(), ...diaryForm, date: todayStr(), created_at: now() })
    setShowDiaryForm(false)
    setDiaryForm({ content: '', mood: 'happy', photos: [] })
    load()
  }

  const saveMemo = async () => {
    if (!memoForm.title && !memoForm.content) return
    const tags = memoForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (editingMemo) {
      await dbUpdate('memos', editingMemo.id, { ...memoForm, tags, updated_at: now() })
    } else {
      await dbInsert('memos', { id: uuid(), ...memoForm, tags, remindAt: '', created_at: now(), updated_at: now() })
    }
    setShowMemoForm(false); setEditingMemo(null)
    setMemoForm({ title: '', content: '', category: 'life', photos: [], tags: '', pinned: false })
    load()
  }

  const deleteItem = async (id: string, table: string) => {
    if (!confirm('确认删除?')) return
    await dbDelete(table, id)
    load()
  }

  const togglePin = async (memo: Memo) => {
    await dbUpdate('memos', memo.id, { pinned: !memo.pinned })
    load()
  }

  const getMoodEmoji = (key: string) => MOODS.find(m => m.key === key)?.emoji || '📝'

  const deleteMetric = async (id: string) => { if (confirm('删除这条记录?')) { await dbDelete('growth_metrics', id); load() } }

  // 图表数据
  const heightValues = metrics.filter(m => m.height > 0).map(m => m.height)
  const heightLabels = metrics.filter(m => m.height > 0).map(m => m.date)
  const weightValues = metrics.filter(m => m.weight > 0).map(m => m.weight)
  const weightLabels = metrics.filter(m => m.weight > 0).map(m => m.date)

  const editable = true

  const exportMilestonesTXT = () => {
    const text = milestones.map(m => {
      const icon = MILESTONE_ICONS.find(i => i.key === m.icon)
      return `[${m.date}] ${icon?.emoji || '🌟'} ${m.title || icon?.label || ''}\n${m.description}\n---`
    }).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '成长里程碑.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  // 最新身高体重
  const latestHeight = metrics.filter(m => m.height > 0).pop()
  const latestWeight = metrics.filter(m => m.weight > 0).pop()

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ color: 'var(--color-secondary)' }}>
          <PixelChildIcon size={28} /> 小孩成长记录
        </h1>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => setShowChildForm(!showChildForm)}>
            {showChildForm ? '关闭' : '编辑信息'}
          </button>
          <button className="btn btn-highlight" onClick={() => {
            if (tab === 'diary') setShowDiaryForm(true)
            else if (tab === 'metrics') setShowMetricForm(true)
            else if (tab === 'milestones') setShowMilestoneForm(true)
            else setShowMemoForm(true)
          }}>
            + {tab === 'diary' ? '写日记' : tab === 'metrics' ? '记录指标' : tab === 'milestones' ? '记录里程碑' : '新建备忘'}
          </button>
        </div>
      </div>

      {/* 小孩信息卡片 */}
      {showChildForm ? (
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(129,212,250,0.1), rgba(164,216,176,0.1))' }}>
          <div className="card-title">孩子信息</div>
          <div className="grid grid-2 gap-3">
            <div className="input-group">
              <label className="input-label">姓名</label>
              <input className="input" value={childInfo.name} onChange={e => setChildInfo({ ...childInfo, name: e.target.value })} placeholder="宝宝的名字" />
            </div>
            <div className="input-group">
              <label className="input-label">性别</label>
              <select className="select" value={childInfo.gender} onChange={e => setChildInfo({ ...childInfo, gender: e.target.value as 'boy' | 'girl' })}>
                <option value="boy">男孩</option>
                <option value="girl">女孩</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">出生日期</label>
              <input className="input" type="date" value={childInfo.birthDate} onChange={e => setChildInfo({ ...childInfo, birthDate: e.target.value })} />
            </div>
            <div className="flex items-end">
              <button className="btn btn-primary" onClick={saveChildInfo}>保存信息</button>
            </div>
          </div>
        </div>
      ) : childInfo.birthDate ? (
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(129,212,250,0.08), rgba(164,216,176,0.08))' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div style={{ fontSize: 40 }}>{childInfo.gender === 'boy' ? '👦' : '👧'}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{childInfo.name || '宝宝'}</div>
                <div className="text-sm text-light">{GENDER_OPTIONS[childInfo.gender]} · {childInfo.birthDate} 出生</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center" style={{ minWidth: 60 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-secondary)' }}>{age.years}</div>
                <div className="text-xs text-light">岁</div>
              </div>
              <div className="text-center" style={{ minWidth: 60 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-secondary)' }}>{age.months}</div>
                <div className="text-xs text-light">个月</div>
              </div>
              <div className="text-center" style={{ minWidth: 60 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-secondary)' }}>{age.days}</div>
                <div className="text-xs text-light">天</div>
              </div>
              <div className="text-center" style={{ minWidth: 70 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#81D4FA' }}>第{age.totalDays}</div>
                <div className="text-xs text-light">天</div>
              </div>
            </div>
          </div>
          {latestHeight && (
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="badge badge-green" style={{ fontSize: 14, padding: '6px 12px' }}>
                身高 {latestHeight.height}cm
              </div>
              {latestWeight && (
                <div className="badge badge-gray" style={{ fontSize: 14, padding: '6px 12px' }}>
                  体重 {latestWeight.weight}kg
                </div>
              )}
              <span className="text-sm text-light" style={{ alignSelf: 'center' }}>最近记录于 {latestHeight.date}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Tab 切换 */}
      <div className="tab-bar">
        <button className={`tab-item ${tab === 'diary' ? 'active' : ''}`} onClick={() => setTab('diary')}>📔 成长日记</button>
        <button className={`tab-item ${tab === 'metrics' ? 'active' : ''}`} onClick={() => setTab('metrics')}>📏 身高体重</button>
        <button className={`tab-item ${tab === 'milestones' ? 'active' : ''}`} onClick={() => setTab('milestones')}>🌟 里程碑</button>
        <button className={`tab-item ${tab === 'memo' ? 'active' : ''}`} onClick={() => setTab('memo')}>📋 育儿备忘</button>
      </div>

      {/* ===== 成长日记 ===== */}
      {tab === 'diary' && (
        <div>
          {diaries.length === 0 ? (
            <div className="card empty-state">
              <PixelChildIcon size={48} />
              <p className="empty-state-text">还没有成长日记，开始记录宝宝的每一天吧!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {diaries.map(diary => (
                <div key={diary.id} className="card" style={{ borderLeft: '3px solid #81D4FA' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 24 }}>{getMoodEmoji(diary.mood)}</span>
                      <div>
                        <div className="text-bold">{diary.date}</div>
                        <div className="text-sm text-light">{MOODS.find(m => m.key === diary.mood)?.label}</div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteItem(diary.id, 'growth_diaries')}>删除</button>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{diary.content}</div>
                  {diary.photos.length > 0 && (
                    <div className="photo-grid mt-2">
                      {diary.photos.map((p, i) => <div key={i} className="photo-grid-item"><img src={p} alt="" /></div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 身高体重 ===== */}
      {tab === 'metrics' && (
        <div>
          {metrics.length === 0 ? (
            <div className="card empty-state">
              <PixelLeaf size={48} />
              <p className="empty-state-text">还没有身高体重数据，开始记录宝宝的成长曲线吧!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {heightValues.length >= 2 && (
                <div className="card">
                  <div className="card-title">身高趋势 (cm)</div>
                  <LineChart data={heightValues} labels={heightLabels} color="#64B5F6" height={200} />
                </div>
              )}
              {weightValues.length >= 2 && (
                <div className="card">
                  <div className="card-title">体重趋势 (kg)</div>
                  <LineChart data={weightValues} labels={weightLabels} color="#F48FB1" height={200} />
                </div>
              )}
              <div className="card">
                <div className="card-title">历史记录</div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>日期</th><th>身高(cm)</th><th>体重(kg)</th><th>备注</th><th></th></tr></thead>
                    <tbody>
                      {[...metrics].reverse().map(m => (
                        <tr key={m.id}>
                          <td>{m.date}</td>
                          <td>{m.height || '-'}</td>
                          <td>{m.weight || '-'}</td>
                          <td className="text-sm text-light">{m.note}</td>
                          <td><button className="btn btn-sm btn-danger" onClick={() => deleteMetric(m.id)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 里程碑 ===== */}
      {tab === 'milestones' && (
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-light text-sm">共 {milestones.length} 个里程碑</span>
            <button className="btn btn-sm btn-outline" onClick={exportMilestonesTXT}>导出TXT</button>
          </div>
          {milestones.length === 0 ? (
            <div className="card empty-state">
              <PixelChildIcon size={48} />
              <p className="empty-state-text">还没有里程碑，记录宝宝每一个重要的"第一次"吧!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {milestones.map(m => {
                const icon = MILESTONE_ICONS.find(i => i.key === m.icon)
                return (
                  <div key={m.id} className="card" style={{ borderLeft: '3px solid var(--color-secondary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 28 }}>{icon?.emoji || '🌟'}</span>
                        <div>
                          <div className="text-bold">{m.title || icon?.label}</div>
                          <div className="text-sm text-light">{m.date}</div>
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteItem(m.id, 'milestones')}>删除</button>
                    </div>
                    {m.description && <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{m.description}</div>}
                    {m.photos.length > 0 && (
                      <div className="photo-grid mt-2">
                        {m.photos.map((p, i) => <div key={i} className="photo-grid-item"><img src={p} alt="" /></div>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== 备忘录 ===== */}
      {tab === 'memo' && (
        <div>
          {memos.length === 0 ? (
            <div className="card empty-state">
              <PixelLeaf size={48} />
              <p className="empty-state-text">暂无育儿备忘</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {memos.map(memo => (
                <div key={memo.id} className="card" style={{ borderLeft: `3px solid ${MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES]?.color || '#9E9E9E'}` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {memo.pinned && <span>📌</span>}
                        <span className="text-bold">{memo.title || '无标题'}</span>
                        <span className="badge badge-gray">{(MEMO_CATEGORIES as any)[memo.category]?.label || memo.category}</span>
                      </div>
                      <div className="text-sm" style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>{memo.content}</div>
                      {memo.photos && memo.photos.length > 0 && (
                        <div className="photo-grid mt-2">
                          {memo.photos.map((p: string, i: number) => <div key={i} className="photo-grid-item"><img src={p} alt="" /></div>)}
                        </div>
                      )}
                      {memo.tags && memo.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {memo.tags.map((t: string, i: number) => <span key={i} className="badge badge-green">#{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="btn btn-sm btn-outline" onClick={() => togglePin(memo)}>{memo.pinned ? '取消置顶' : '置顶'}</button>
                      <button className="btn btn-sm btn-outline" onClick={() => {
                        setEditingMemo(memo)
                        setMemoForm({ title: memo.title, content: memo.content, category: memo.category as keyof typeof MEMO_CATEGORIES, photos: memo.photos || [], tags: (memo.tags || []).join(', '), pinned: memo.pinned })
                        setShowMemoForm(true)
                      }}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteItem(memo.id, 'memos')}>删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 弹窗：成长日记表单 ===== */}
      {showDiaryForm && (
        <div className="modal-overlay" onClick={() => setShowDiaryForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">写成长日记</span>
              <button className="modal-close" onClick={() => setShowDiaryForm(false)}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="input-group">
                <label className="input-label">心情</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map(m => (
                    <button key={m.key} onClick={() => setDiaryForm({ ...diaryForm, mood: m.key })} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      border: diaryForm.mood === m.key ? '2px solid #81D4FA' : '1.5px solid var(--color-border)',
                      background: diaryForm.mood === m.key ? 'rgba(129,212,250,0.15)' : 'transparent',
                      cursor: 'pointer', fontSize: 18, fontFamily: 'var(--font-main)'
                    }}>{m.emoji} <span style={{ fontSize: 12 }}>{m.label}</span></button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">内容</label>
                <textarea className="textarea" style={{ minHeight: 120 }} value={diaryForm.content} onChange={e => setDiaryForm({ ...diaryForm, content: e.target.value })} placeholder="记录宝宝今天的成长瞬间..." />
              </div>
              <div className="input-group">
                <label className="input-label">照片</label>
                <PhotoUpload photos={diaryForm.photos} onChange={photos => setDiaryForm({ ...diaryForm, photos })} max={9} />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setShowDrawing(true)}>手绘</button>
                <button className="btn btn-primary flex-1" onClick={saveDiary}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 弹窗：身高体重表单 ===== */}
      {showMetricForm && (
        <div className="modal-overlay" onClick={() => setShowMetricForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title">记录身高体重</span>
              <button className="modal-close" onClick={() => setShowMetricForm(false)}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="input-group">
                <label className="input-label">日期</label>
                <input className="input" type="date" value={metricForm.date} onChange={e => setMetricForm({ ...metricForm, date: e.target.value })} />
              </div>
              <div className="grid grid-2 gap-3">
                <div className="input-group">
                  <label className="input-label">身高 (cm)</label>
                  <input className="input" type="number" step="0.1" value={metricForm.height} onChange={e => setMetricForm({ ...metricForm, height: e.target.value })} placeholder="如: 85.5" />
                </div>
                <div className="input-group">
                  <label className="input-label">体重 (kg)</label>
                  <input className="input" type="number" step="0.1" value={metricForm.weight} onChange={e => setMetricForm({ ...metricForm, weight: e.target.value })} placeholder="如: 12.3" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">备注</label>
                <input className="input" value={metricForm.note} onChange={e => setMetricForm({ ...metricForm, note: e.target.value })} placeholder="如: 体检记录" />
              </div>
              <button className="btn btn-primary" onClick={saveMetric}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 弹窗：里程碑表单 ===== */}
      {showMilestoneForm && (
        <div className="modal-overlay" onClick={() => setShowMilestoneForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">记录里程碑</span>
              <button className="modal-close" onClick={() => setShowMilestoneForm(false)}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="input-group">
                <label className="input-label">类型</label>
                <div className="flex gap-2 flex-wrap">
                  {MILESTONE_ICONS.map(m => (
                    <button key={m.key} onClick={() => setMilestoneForm({ ...milestoneForm, icon: m.key, title: milestoneForm.title || m.label })} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      border: milestoneForm.icon === m.key ? '2px solid var(--color-secondary)' : '1.5px solid var(--color-border)',
                      background: milestoneForm.icon === m.key ? 'rgba(45,90,61,0.1)' : 'transparent',
                      cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-main)'
                    }}>{m.emoji} <span style={{ fontSize: 11 }}>{m.label}</span></button>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">标题</label>
                <input className="input" value={milestoneForm.title} onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })} placeholder="如: 第一次叫妈妈" />
              </div>
              <div className="input-group">
                <label className="input-label">日期</label>
                <input className="input" type="date" value={milestoneForm.date} onChange={e => setMilestoneForm({ ...milestoneForm, date: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">描述</label>
                <textarea className="textarea" style={{ minHeight: 80 }} value={milestoneForm.description} onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })} placeholder="详细记录这个重要时刻..." />
              </div>
              <div className="input-group">
                <label className="input-label">照片</label>
                <PhotoUpload photos={milestoneForm.photos} onChange={photos => setMilestoneForm({ ...milestoneForm, photos })} max={9} />
              </div>
              <button className="btn btn-primary" onClick={saveMilestone}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 弹窗：备忘录表单 ===== */}
      {showMemoForm && (
        <div className="modal-overlay" onClick={() => { setShowMemoForm(false); setEditingMemo(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title">{editingMemo ? '编辑备忘' : '新建备忘'}</span>
              <button className="modal-close" onClick={() => { setShowMemoForm(false); setEditingMemo(null) }}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid grid-2">
                <div className="input-group">
                  <label className="input-label">标题</label>
                  <input className="input" value={memoForm.title} onChange={e => setMemoForm({ ...memoForm, title: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">分类</label>
                  <select className="select" value={memoForm.category} onChange={e => setMemoForm({ ...memoForm, category: e.target.value as keyof typeof MEMO_CATEGORIES })}>
                    {Object.entries(MEMO_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">内容</label>
                <textarea className="textarea" style={{ minHeight: 150 }} value={memoForm.content} onChange={e => setMemoForm({ ...memoForm, content: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">照片</label>
                <PhotoUpload photos={memoForm.photos} onChange={photos => setMemoForm({ ...memoForm, photos })} max={9} />
              </div>
              <div className="input-group">
                <label className="input-label">标签 (逗号分隔)</label>
                <input className="input" value={memoForm.tags} onChange={e => setMemoForm({ ...memoForm, tags: e.target.value })} placeholder="如: 疫苗, 体检" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={memoForm.pinned} onChange={e => setMemoForm({ ...memoForm, pinned: e.target.checked })} style={{ width: 18, height: 18 }} />
                <span>置顶</span>
              </label>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => setShowDrawing(true)}>手绘</button>
                <button className="btn btn-primary flex-1" onClick={saveMemo}>{editingMemo ? '保存' : '创建'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 手绘画板 */}
      {showDrawing && (
        <DrawingBoard
          onSave={(dataUrl) => {
            if (tab === 'diary') setDiaryForm({ ...diaryForm, photos: [...diaryForm.photos, dataUrl] })
            else if (tab === 'milestones') setMilestoneForm({ ...milestoneForm, photos: [...milestoneForm.photos, dataUrl] })
            else setMemoForm({ ...memoForm, photos: [...memoForm.photos, dataUrl] })
            setShowDrawing(false)
          }}
          onClose={() => setShowDrawing(false)}
        />
      )}
    </div>
  )
}
