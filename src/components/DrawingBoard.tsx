import { useRef, useState, useEffect, useCallback } from 'react'

interface DrawingBoardProps {
  onSave: (dataUrl: string) => void
  onClose: () => void
}

const COLORS = ['#000000', '#E57373', '#FF9800', '#FFD54F', '#4CAF50', '#2D5A3D', '#64B5F6', '#7B1FA2', '#8B6914', '#F48FB1', '#FFFFFF', '#9E9E9E']
const BRUSHES = ['round', 'highlighter', 'pencil', 'brush'] as const
const BACKGROUNDS = ['blank', 'grid', 'lined'] as const

export default function DrawingBoard({ onSave, onClose }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [color, setColor] = useState('#2D5A3D')
  const [brush, setBrush] = useState<typeof BRUSHES[number]>('round')
  const [size, setSize] = useState(3)
  const [bg, setBg] = useState<typeof BACKGROUNDS[number]>('blank')
  const [showShapes, setShowShapes] = useState(false)
  const [shape, setShape] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)
  const [textValue, setTextValue] = useState('')
  const drawing = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const snapshot = useRef<ImageData | null>(null)
  const history = useRef<ImageData[]>([])
  const historyIndex = useRef(-1)
  const recentColors = useRef<string[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
    drawBackground()
    saveHistory()
  }, [])

  const drawBackground = () => {
    const canvas = canvasRef.current!
    const ctx = ctxRef.current!
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2)
    if (bg === 'grid') {
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width / 2; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height / 2); ctx.stroke()
      }
      for (let y = 0; y < canvas.height / 2; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width / 2, y); ctx.stroke()
      }
    } else if (bg === 'lined') {
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 0.5
      for (let y = 20; y < canvas.height / 2; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width / 2, y); ctx.stroke()
      }
    }
    ctx.restore()
  }

  const saveHistory = () => {
    const ctx = ctxRef.current!
    const data = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    history.current = history.current.slice(0, historyIndex.current + 1)
    history.current.push(data)
    if (history.current.length > 10) history.current.shift()
    historyIndex.current = history.current.length - 1
  }

  const undo = () => {
    if (historyIndex.current > 0) {
      historyIndex.current--
      ctxRef.current!.putImageData(history.current[historyIndex.current], 0, 0)
    }
  }

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true
    const pos = getPos(e)
    startPos.current = pos
    const ctx = ctxRef.current!
    if (shape) {
      snapshot.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    } else {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const pos = getPos(e)
    const ctx = ctxRef.current!

    if (shape) {
      if (snapshot.current) ctx.putImageData(snapshot.current, 0, 0)
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.beginPath()
      if (shape === 'line') {
        ctx.moveTo(startPos.current.x, startPos.current.y)
        ctx.lineTo(pos.x, pos.y)
      } else if (shape === 'rect') {
        ctx.rect(startPos.current.x, startPos.current.y, pos.x - startPos.current.x, pos.y - startPos.current.y)
      } else if (shape === 'circle') {
        const r = Math.hypot(pos.x - startPos.current.x, pos.y - startPos.current.y)
        ctx.arc(startPos.current.x, startPos.current.y, r, 0, Math.PI * 2)
      } else if (shape === 'arrow') {
        ctx.moveTo(startPos.current.x, startPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        const angle = Math.atan2(pos.y - startPos.current.y, pos.x - startPos.current.x)
        ctx.lineTo(pos.x - 10 * Math.cos(angle - 0.4), pos.y - 10 * Math.sin(angle - 0.4))
        ctx.moveTo(pos.x, pos.y)
        ctx.lineTo(pos.x - 10 * Math.cos(angle + 0.4), pos.y - 10 * Math.sin(angle + 0.4))
      }
      ctx.stroke()
    } else {
      ctx.strokeStyle = color
      ctx.lineWidth = brush === 'highlighter' ? size * 3 : size
      ctx.globalAlpha = brush === 'highlighter' ? 0.4 : brush === 'pencil' ? 0.7 : 1
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  const endDraw = () => {
    if (drawing.current) {
      drawing.current = false
      saveHistory()
      if (!recentColors.current.includes(color)) {
        recentColors.current = [color, ...recentColors.current].slice(0, 4)
      }
    }
  }

  const addText = () => {
    if (!textValue) return
    const ctx = ctxRef.current!
    ctx.fillStyle = color
    ctx.font = `${size * 4}px sans-serif`
    ctx.fillText(textValue, 20, 30)
    setTextValue('')
    setShowText(false)
    saveHistory()
  }

  const handleSave = () => {
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    onSave(dataUrl)
  }

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '50vh', background: 'var(--color-bg)', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', zIndex: 1500, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>手绘画板</span>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-highlight" onClick={handleSave}>保存PNG</button>
          <button className="btn btn-sm btn-outline" onClick={onClose}>关闭</button>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 8, padding: '6px 12px', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
        {/* 颜色 */}
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: color === c ? '2px solid #1A3C2A' : '1px solid #ccc', cursor: 'pointer' }} />
          ))}
        </div>
        {/* 最近颜色 */}
        {recentColors.current.length > 0 && (
          <div className="flex gap-1" style={{ borderLeft: '1px solid #ccc', paddingLeft: 4 }}>
            {recentColors.current.map((c, i) => (
              <button key={i} onClick={() => setColor(c)} style={{ width: 18, height: 18, borderRadius: 3, background: c, border: '1px solid #999', cursor: 'pointer' }} />
            ))}
          </div>
        )}
        {/* 画笔 */}
        <select className="select" style={{ width: 'auto', fontSize: 11 }} value={brush} onChange={e => setBrush(e.target.value as any)}>
          <option value="round">圆头笔</option>
          <option value="highlighter">荧光笔</option>
          <option value="pencil">铅笔</option>
          <option value="brush">毛笔</option>
        </select>
        {/* 粗细 */}
        <select className="select" style={{ width: 'auto', fontSize: 11 }} value={size} onChange={e => setSize(Number(e.target.value))}>
          <option value={2}>细</option>
          <option value={3}>中</option>
          <option value={5}>粗</option>
        </select>
        {/* 形状 */}
        <div className="flex gap-1">
          <button className={`btn btn-sm ${shape === 'line' ? 'btn-highlight' : 'btn-outline'}`} onClick={() => setShape(shape === 'line' ? null : 'line')}>直线</button>
          <button className={`btn btn-sm ${shape === 'circle' ? 'btn-highlight' : 'btn-outline'}`} onClick={() => setShape(shape === 'circle' ? null : 'circle')}>圆</button>
          <button className={`btn btn-sm ${shape === 'rect' ? 'btn-highlight' : 'btn-outline'}`} onClick={() => setShape(shape === 'rect' ? null : 'rect')}>方</button>
          <button className={`btn btn-sm ${shape === 'arrow' ? 'btn-highlight' : 'btn-outline'}`} onClick={() => setShape(shape === 'arrow' ? null : 'arrow')}>箭头</button>
        </div>
        {/* 文字 */}
        <button className="btn btn-sm btn-outline" onClick={() => setShowText(!showText)}>文字</button>
        {/* 撤销 */}
        <button className="btn btn-sm btn-outline" onClick={undo} disabled={historyIndex.current <= 0}>撤销</button>
        {/* 背景 */}
        <select className="select" style={{ width: 'auto', fontSize: 11 }} value={bg} onChange={e => { setBg(e.target.value as any); setTimeout(drawBackground, 0) }}>
          <option value="blank">空白</option>
          <option value="grid">网格</option>
          <option value="lined">横线</option>
        </select>
      </div>

      {/* 文字输入 */}
      {showText && (
        <div className="flex gap-2" style={{ padding: '4px 12px' }}>
          <input className="input" placeholder="输入文字..." value={textValue} onChange={e => setTextValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && addText()} />
          <button className="btn btn-sm btn-highlight" onClick={addText}>添加</button>
        </div>
      )}

      {/* 画布 */}
      <div style={{ flex: 1, padding: 8, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', background: 'white', borderRadius: 8, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
    </div>
  )
}
