import { ICONS, PixelLeaf } from './PixelIcon'
import type { PageId } from '../types'

interface SidebarProps {
  currentPage: PageId
  onPageChange: (page: PageId) => void
  collapsed: boolean
  onToggleCollapse: () => void
  isMobile: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  onOpenSettings: () => void
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'today', label: '今日中枢' },
  { id: 'customers', label: '客户跟踪' },
  { id: 'reminders', label: '智能提醒中心' },
  { id: 'inspiration', label: '灵感补给' },
  { id: 'notes', label: '每日随手记&反思' },
  { id: 'words', label: '单词学习' },
  { id: 'capsule', label: '时光胶囊' },
  { id: 'wealth', label: '财富工坊' },
]

export default function Sidebar({
  currentPage, onPageChange, collapsed, onToggleCollapse, isMobile, mobileOpen, onMobileClose, onOpenSettings
}: SidebarProps) {
  const handleNav = (page: PageId) => {
    onPageChange(page)
    if (isMobile) onMobileClose()
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
        />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile && !mobileOpen ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <PixelLeaf size={36} color="#7DBF8A" />
          </div>
          {!collapsed && <span className="sidebar-title">森系工作台</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const Icon = ICONS[item.id]
            return (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
              >
                <span className="nav-icon">
                  <Icon size={24} />
                </span>
                <span className="nav-label">{item.label}</span>
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="collapse-btn" onClick={onOpenSettings} style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '16px' }}>⚙</span>
            {!collapsed && <span>设置</span>}
          </button>
          <button className="collapse-btn" onClick={onToggleCollapse}>
            <span style={{ fontSize: '16px' }}>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>收起</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
