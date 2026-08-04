import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`loading-screen ${hidden ? 'hidden' : ''}`}>
      <svg className="loading-grass" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        {/* 天空渐变 */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8D8EA" />
            <stop offset="60%" stopColor="#B8D8B0" />
            <stop offset="100%" stopColor="#8BBF8A" />
          </linearGradient>
        </defs>
        <rect width="500" height="300" fill="url(#sky)" />

        {/* 像素云 */}
        <g fill="#FFFFFF" opacity="0.8">
          <rect x="40" y="40" width="60" height="12" />
          <rect x="50" y="32" width="40" height="8" />
          <rect x="200" y="50" width="80" height="12" />
          <rect x="215" y="42" width="50" height="8" />
          <rect x="370" y="35" width="55" height="10" />
          <rect x="380" y="28" width="35" height="7" />
        </g>

        {/* 远山 - 深绿 */}
        <g fill="#2D5A3D" opacity="0.6">
          <rect x="0" y="140" width="80" height="40" />
          <rect x="20" y="130" width="50" height="10" />
          <rect x="350" y="135" width="100" height="45" />
          <rect x="370" y="120" width="60" height="15" />
        </g>

        {/* 草地层次 - 深浅绿色块交错 */}
        {/* 最远层 */}
        <rect x="0" y="160" width="500" height="20" fill="#5A7A4A" />
        {/* 中层 */}
        <rect x="0" y="175" width="500" height="25" fill="#6B8E5A" />
        {/* 近层 */}
        <rect x="0" y="195" width="500" height="105" fill="#7DBF8A" />

        {/* 草地纹理 - 深浅交错 */}
        <g fill="#5A7A4A" opacity="0.4">
          <rect x="20" y="170" width="12" height="3" />
          <rect x="60" y="168" width="8" height="3" />
          <rect x="100" y="172" width="15" height="3" />
          <rect x="150" y="166" width="10" height="3" />
          <rect x="220" y="170" width="12" height="3" />
          <rect x="280" y="168" width="8" height="3" />
          <rect x="340" y="172" width="14" height="3" />
          <rect x="400" y="167" width="10" height="3" />
          <rect x="450" y="170" width="12" height="3" />
        </g>
        <g fill="#8FD49E" opacity="0.5">
          <rect x="35" y="180" width="10" height="3" />
          <rect x="75" y="178" width="8" height="3" />
          <rect x="120" y="182" width="12" height="3" />
          <rect x="180" y="176" width="10" height="3" />
          <rect x="240" y="180" width="8" height="3" />
          <rect x="300" y="178" width="12" height="3" />
          <rect x="360" y="182" width="10" height="3" />
          <rect x="420" y="177" width="8" height="3" />
          <rect x="465" y="180" width="10" height="3" />
        </g>

        {/* 像素树 - 左 */}
        <g>
          <rect x="40" y="90" width="6" height="8" fill="#8B6914" />
          <rect x="30" y="70" width="26" height="6" fill="#2D5A3D" />
          <rect x="26" y="76" width="34" height="10" fill="#5A7A4A" />
          <rect x="28" y="86" width="30" height="6" fill="#2D5A3D" />
          <rect x="34" y="92" width="18" height="4" fill="#5A7A4A" />
          {/* 叶子高光 */}
          <rect x="32" y="78" width="4" height="3" fill="#7DBF8A" />
          <rect x="48" y="80" width="3" height="2" fill="#7DBF8A" />
        </g>

        {/* 像素树 - 右 */}
        <g>
          <rect x="420" y="85" width="6" height="10" fill="#8B6914" />
          <rect x="405" y="60" width="36" height="8" fill="#2D5A3D" />
          <rect x="400" y="68" width="46" height="12" fill="#5A7A4A" />
          <rect x="402" y="80" width="42" height="6" fill="#2D5A3D" />
          <rect x="410" y="86" width="24" height="4" fill="#5A7A4A" />
          <rect x="408" y="72" width="5" height="3" fill="#7DBF8A" />
          <rect x="430" y="74" width="4" height="2" fill="#7DBF8A" />
        </g>

        {/* 像素花朵 - 红 */}
        <g>
          <rect x="120" y="185" width="2" height="6" fill="#5A7A4A" />
          <rect x="117" y="180" width="8" height="2" fill="#E57373" />
          <rect x="118" y="178" width="6" height="2" fill="#E57373" />
          <rect x="119" y="183" width="4" height="1" fill="#FFD54F" />
        </g>
        {/* 像素花朵 - 粉 */}
        <g>
          <rect x="260" y="188" width="2" height="5" fill="#5A7A4A" />
          <rect x="257" y="184" width="8" height="2" fill="#F48FB1" />
          <rect x="258" y="182" width="6" height="2" fill="#F48FB1" />
          <rect x="259" y="186" width="4" height="1" fill="#FFD54F" />
        </g>
        {/* 像素花朵 - 蓝 */}
        <g>
          <rect x="380" y="186" width="2" height="6" fill="#5A7A4A" />
          <rect x="377" y="181" width="8" height="2" fill="#64B5F6" />
          <rect x="378" y="179" width="6" height="2" fill="#64B5F6" />
          <rect x="379" y="184" width="4" height="1" fill="#FFD54F" />
        </g>

        {/* 像素草丛 */}
        <g fill="#2D5A3D" opacity="0.6">
          <rect x="180" y="195" width="3" height="6" />
          <rect x="184" y="193" width="2" height="8" />
          <rect x="187" y="196" width="3" height="5" />
          <rect x="320" y="195" width="3" height="6" />
          <rect x="324" y="193" width="2" height="8" />
          <rect x="327" y="196" width="3" height="5" />
        </g>

        {/* 像素苹果掉落在草地上 */}
        <g>
          <rect x="155" y="205" width="8" height="6" fill="#E57373" />
          <rect x="156" y="204" width="6" height="1" fill="#E57373" />
          <rect x="158" y="202" width="2" height="2" fill="#8B6914" />
          <rect x="160" y="201" width="3" height="1" fill="#5A7A4A" />
          <rect x="157" y="206" width="2" height="2" fill="#FF8A80" />
        </g>

        {/* 小蘑菇 */}
        <g>
          <rect x="445" y="205" width="2" height="5" fill="#F5F5F5" />
          <rect x="442" y="200" width="8" height="5" fill="#E57373" />
          <rect x="444" y="201" width="1" height="1" fill="#FFFFFF" />
          <rect x="447" y="202" width="1" height="1" fill="#FFFFFF" />
        </g>
      </svg>

      <div className="loading-slogan">
        天地通，年月通，日事通，万事皆成!
      </div>
      <div className="loading-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  )
}
