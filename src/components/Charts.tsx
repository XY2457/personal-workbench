interface LineChartProps {
  data: number[]
  labels?: string[]
  color?: string
  height?: number
  width?: number
}

export function LineChart({ data, labels, color = '#2D5A3D', height = 150, width = 300 }: LineChartProps) {
  if (!data.length) return <div className="empty-state-text">暂无数据</div>
  const max = Math.max(...data) * 1.1 || 1
  const min = Math.min(...data) * 0.9 || 0
  const range = max - min || 1
  const step = width / Math.max(data.length - 1, 1)

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
  const pathD = `M ${points.join(' L ')}`
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} width="100%" style={{ maxWidth: '100%' }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="#E0E0E0" strokeWidth="0.5" />
      ))}
      {/* 区域 */}
      <path d={areaD} fill={`url(#grad-${color})`} />
      {/* 线 */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* 点 */}
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - ((v - min) / range) * height} r="3" fill={color} />
      ))}
      {/* 标签 */}
      {labels && labels.map((l, i) => (
        <text key={i} x={i * step} y={height + 14} fontSize="9" fill="#999" textAnchor="middle">{l}</text>
      ))}
    </svg>
  )
}

interface PieChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
}

export function PieChart({ data, size = 160 }: PieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div className="empty-state-text">暂无数据</div>

  let currentAngle = -Math.PI / 2
  const cx = size / 2, cy = size / 2, r = size / 2 - 4

  const slices = data.map(d => {
    const angle = (d.value / total) * Math.PI * 2
    const x1 = cx + r * Math.cos(currentAngle)
    const y1 = cy + r * Math.sin(currentAngle)
    currentAngle += angle
    const x2 = cx + r * Math.cos(currentAngle)
    const y2 = cy + r * Math.sin(currentAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: d.color, label: d.label, value: d.value, percent: (d.value / total * 100).toFixed(1) }
  })

  return (
    <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
      <svg width={size} height={size}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1.5" />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.4} fill="white" />
        <text x={cx} y={cy - 4} fontSize="11" fill="#666" textAnchor="middle">合计</text>
        <text x={cx} y={cy + 10} fontSize="14" fill="#1A3C2A" textAnchor="middle" fontWeight="bold">{total.toFixed(0)}</text>
      </svg>
      <div className="flex flex-col gap-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1 text-sm">
            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: 'inline-block' }} />
            <span>{s.label}</span>
            <span className="text-light">{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface BarChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

export function BarChart({ data, color = '#7DBF8A', height = 120 }: BarChartProps) {
  if (!data.length) return <div className="empty-state-text">暂无数据</div>
  const max = Math.max(...data.map(d => d.value)) * 1.1 || 1
  const barWidth = 100 / data.length

  return (
    <svg viewBox={`0 0 100 ${height + 16}`} width="100%" style={{ maxWidth: '100%' }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * height
        const y = height - h
        return (
          <g key={i}>
            <rect x={i * barWidth + 1} y={y} width={barWidth - 2} height={h} fill={color} rx="1" />
            <text x={i * barWidth + barWidth / 2} y={height + 10} fontSize="3" fill="#999" textAnchor="middle">{d.label}</text>
            <text x={i * barWidth + barWidth / 2} y={y - 1} fontSize="3" fill="#666" textAnchor="middle">{d.value}</text>
          </g>
        )
      })}
    </svg>
  )
}
