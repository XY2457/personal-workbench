import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import LoadingScreen from './components/LoadingScreen'
import TodayHub from './pages/TodayHub'
import DailyPlan from './pages/DailyPlan'
import DailyTodo from './pages/DailyTodo'
import CustomerTracking from './pages/CustomerTracking'
import ReminderCenter from './pages/ReminderCenter'
import Inspiration from './pages/Inspiration'
import DailyNotes from './pages/DailyNotes'
import WordLearning from './pages/WordLearning'
import TimeCapsule from './pages/TimeCapsule'
import WealthWorkshop from './pages/WealthWorkshop'
import type { PageId } from './types'
import { checkReminders } from './lib/push'
import { exportJSON, exportCSV, exportAllTXT, exportAllWord } from './lib/export'
import { requestNotificationPermission, subscribePush } from './lib/push'
import { isSupabaseConfigured } from './lib/supabase'
import Modal from './components/Modal'

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('today')
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 每分钟检查一次提醒
  useEffect(() => {
    checkReminders()
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  // 每月1日备份提醒
  useEffect(() => {
    const today = new Date()
    if (today.getDate() === 1) {
      const lastBackup = localStorage.getItem('last_backup_reminder')
      const monthKey = `${today.getFullYear()}-${today.getMonth()}`
      if (lastBackup !== monthKey) {
        localStorage.setItem('last_backup_reminder', monthKey)
        import('./lib/push').then(({ showLocalNotification }) => {
          showLocalNotification('备份提醒', '每月1日请记得导出备份您的数据！')
        })
      }
    }
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'today': return <TodayHub onNavigate={setCurrentPage} />
      case 'dailyplan': return <DailyPlan />
      case 'dailytodo': return <DailyTodo />
      case 'customers': return <CustomerTracking />
      case 'reminders': return <ReminderCenter />
      case 'inspiration': return <Inspiration />
      case 'notes': return <DailyNotes />
      case 'words': return <WordLearning />
      case 'capsule': return <TimeCapsule />
      case 'wealth': return <WealthWorkshop />
      default: return <TodayHub onNavigate={setCurrentPage} />
    }
  }

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      const sub = await subscribePush()
      setPushEnabled(!!sub || granted)
      if (sub) {
        alert('推送通知已启用!')
      } else {
        alert('通知权限已获取，本地提醒已启用。(VAPID密钥未配置，远程推送暂不可用)')
      }
    } else {
      alert('通知权限被拒绝，请在浏览器设置中允许通知。')
    }
  }

  const handleExport = async (format: 'json' | 'csv' | 'txt' | 'word') => {
    setExporting(format)
    try {
      if (format === 'json') await exportJSON()
      else if (format === 'csv') await exportCSV()
      else if (format === 'txt') await exportAllTXT()
      else await exportAllWord()
    } catch (e) {
      alert('导出失败: ' + e)
    }
    setExporting(null)
  }

  return (
    <>
      <LoadingScreen />
      <div className="app-container">
        {isMobile && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              position: 'fixed', top: 'calc(12px + var(--safe-area-top))', left: 12, zIndex: 50,
              background: 'var(--color-secondary)', color: 'white', border: 'none', borderRadius: 8,
              width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >☰</button>
        )}
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onOpenSettings={() => setShowSettings(true)}
        />
        <main className="content-area">
          <div className="content-inner">
            {renderPage()}
          </div>
        </main>
      </div>

      <Modal open={showSettings} title="设置" onClose={() => setShowSettings(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-bold mb-2 text-primary">数据存储</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="text-sm text-light mb-2">
                当前模式: {isSupabaseConfigured() ? 'Supabase 云端同步' : '本地存储 (localStorage)'}
              </div>
              {!isSupabaseConfigured() && (
                <div className="text-sm" style={{ color: 'var(--color-warning)' }}>
                  未配置 Supabase，数据仅保存在本地浏览器。配置后可云端同步。
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-bold mb-2 text-primary">推送通知</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="flex items-center justify-between">
                <span className="text-sm">系统级推送提醒</span>
                <button className={'btn btn-sm ' + (pushEnabled ? 'btn-highlight' : 'btn-outline')} onClick={handleEnablePush}>
                  {pushEnabled ? '已启用' : '启用'}
                </button>
              </div>
              <div className="text-sm text-light mt-2">
                启用后可在手机锁屏接收提醒通知
              </div>
            </div>
          </div>

          <div>
            <div className="text-bold mb-2 text-primary">数据导出</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="text-sm text-light mb-2">导出全部数据（JSON/CSV 适合备份，TXT/Word 适合阅读打印）</div>
              <div className="flex gap-2 mb-2">
                <button className="btn btn-primary flex-1" disabled={exporting !== null} onClick={() => handleExport('json')}>
                  {exporting === 'json' ? '导出中...' : 'JSON 备份'}
                </button>
                <button className="btn btn-outline flex-1" disabled={exporting !== null} onClick={() => handleExport('csv')}>
                  {exporting === 'csv' ? '导出中...' : 'CSV 表格'}
                </button>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline flex-1" disabled={exporting !== null} onClick={() => handleExport('txt')}>
                  {exporting === 'txt' ? '导出中...' : 'TXT 文本'}
                </button>
                <button className="btn btn-outline flex-1" disabled={exporting !== null} onClick={() => handleExport('word')}>
                  {exporting === 'word' ? '导出中...' : 'Word 文档'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="text-bold mb-2 text-primary">关于</div>
            <div className="card" style={{ padding: 12 }}>
              <div className="text-sm">森系工作台 v1.0</div>
              <div className="text-sm text-light mt-1">天地通，年月通，日事通，万事皆成!</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
