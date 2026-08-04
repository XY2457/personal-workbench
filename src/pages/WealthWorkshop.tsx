import { useState, useEffect } from 'react'
import { dbGet, dbInsert, dbUpdate, dbDelete, uuid, now, todayStr } from '../lib/db'
import type { Expense, FixedExpense, ShoppingItem, WishItem } from '../types'
import { PixelWealthIcon, PixelLeaf } from '../components/PixelIcon'
import { LineChart, PieChart } from '../components/Charts'
import { fetchGoldPrice, GoldPrice } from '../lib/goldPrice'
import Modal from '../components/Modal'
import { showLocalNotification } from '../lib/push'

const QUICK_CATEGORIES = ['餐饮', '交通', '日用品', '娱乐', '房租', '水电', '工资', '其他']
const EXPENSE_COLORS: Record<string, string> = {
  '餐饮': '#E57373', '交通': '#64B5F6', '日用品': '#7DBF8A', '娱乐': '#D4A03A',
  '房租': '#AB47BC', '水电': '#26A69A', '工资': '#66BB6A', '其他': '#78909C'
}

export default function WealthWorkshop() {
  const [tab, setTab] = useState<'account' | 'analysis' | 'fixed' | 'shopping' | 'wish' | 'gold'>('account')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [wishItems, setWishItems] = useState<WishItem[]>([])
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null)
  const [goldLoading, setGoldLoading] = useState(false)
  const [goldAlertPrice, setGoldAlertPrice] = useState<number | ''>('')

  // 记账表单
  const [expForm, setExpForm] = useState({ type: 'variable' as Expense['type'], amount: '', category: '餐饮', date: todayStr(), note: '', photo: '' })
  const [fixedForm, setFixedForm] = useState({ name: '', amount: '', deductDate: 1 })
  const [shopForm, setShopForm] = useState({ name: '', price: '', quantity: 1 })
  const [wishForm, setWishForm] = useState({ name: '', coins: 10 })

  // 五账户
  const [accounts, setAccounts] = useState({ daily: 0, dailyLimit: 0, fixed: 0, income: 0, wish: 0 })

  const load = async () => {
    const exp = await dbGet<Expense[]>('expenses') as Expense[]
    setExpenses(exp.sort((a, b) => b.created_at.localeCompare(a.created_at)))

    const fixed = await dbGet<FixedExpense[]>('fixed_expenses') as FixedExpense[]
    setFixedExpenses(fixed)

    const shop = await dbGet<ShoppingItem[]>('shopping_items') as ShoppingItem[]
    setShoppingItems(shop.sort((a, b) => b.created_at.localeCompare(a.created_at)))

    const wish = await dbGet<WishItem[]>('wish_items') as WishItem[]
    setWishItems(wish)

    // 计算五账户
    const now_ = new Date()
    const currentDay = now_.getDate()
    const monthlyLimit = currentDay * 50
    const monthPrefix = todayStr().slice(0, 7)
    const monthVariable = exp.filter(e => e.type === 'variable' && e.date.startsWith(monthPrefix)).reduce((s, e) => s + Number(e.amount), 0)
    const monthFixed = exp.filter(e => e.type === 'fixed' && e.date.startsWith(monthPrefix)).reduce((s, e) => s + Number(e.amount), 0)
    const monthIncome = exp.filter(e => e.type === 'income' && e.date.startsWith(monthPrefix)).reduce((s, e) => s + Number(e.amount), 0)
    const wishCoins = wish.filter(w => !w.redeemed).reduce((s, w) => s + 0, 0) // 金币来自其他模块

    setAccounts({
      daily: Math.max(0, monthlyLimit - monthVariable),
      dailyLimit: monthlyLimit,
      fixed: monthFixed,
      income: monthIncome,
      wish: wishCoins
    })

    // 检查固定支出到期
    const today = now_.getDate()
    for (const f of fixed) {
      if (f.active && f.deductDate === today) {
        const alreadyDeducted = exp.some(e => e.type === 'fixed' && e.category === f.name && e.date === todayStr())
        if (!alreadyDeducted) {
          await dbInsert('expenses', {
            id: uuid(), type: 'fixed', amount: f.amount, category: f.name,
            date: todayStr(), note: '自动扣减', photo: '', created_at: now()
          })
          showLocalNotification('固定支出扣款', `${f.name} 已扣款 ¥${f.amount}`)
        }
      }
    }
  }

  useEffect(() => { load() }, [])

  // 金价
  const refreshGold = async () => {
    setGoldLoading(true)
    const gp = await fetchGoldPrice()
    setGoldPrice(gp)
    localStorage.setItem('cached_gold_price', JSON.stringify(gp))
    setGoldLoading(false)
  }

  useEffect(() => {
    if (tab === 'gold') refreshGold()
  }, [tab])

  // 金价提醒检查
  useEffect(() => {
    if (goldPrice && goldAlertPrice && goldPrice.domestic >= Number(goldAlertPrice)) {
      showLocalNotification('金价提醒', `国内金价已达 ¥${goldPrice.domestic}/克，触发目标价 ¥${goldAlertPrice}!`)
    }
  }, [goldPrice, goldAlertPrice])

  const addExpense = async () => {
    if (!expForm.amount) return
    await dbInsert('expenses', {
      id: uuid(), type: expForm.type, amount: Number(expForm.amount),
      category: expForm.category, date: expForm.date, note: expForm.note,
      photo: expForm.photo, created_at: now()
    })
    setExpForm({ type: 'variable', amount: '', category: '餐饮', date: todayStr(), note: '', photo: '' })
    load()
  }

  const deleteExpense = async (id: string) => {
    await dbDelete('expenses', id)
    load()
  }

  const addFixed = async () => {
    if (!fixedForm.name || !fixedForm.amount) return
    await dbInsert('fixed_expenses', {
      id: uuid(), name: fixedForm.name, amount: Number(fixedForm.amount),
      deductDate: fixedForm.deductDate, active: true, created_at: now()
    })
    setFixedForm({ name: '', amount: '', deductDate: 1 })
    load()
  }

  const toggleFixed = async (f: FixedExpense) => {
    await dbUpdate('fixed_expenses', f.id, { active: !f.active })
    load()
  }

  const skipFixed = async (f: FixedExpense) => {
    await dbUpdate('fixed_expenses', f.id, { deductDate: f.deductDate + 30 > 31 ? f.deductDate + 30 - 31 : f.deductDate + 30 })
    load()
  }

  const deleteFixed = async (id: string) => {
    await dbDelete('fixed_expenses', id)
    load()
  }

  const addShopping = async () => {
    if (!shopForm.name) return
    await dbInsert('shopping_items', {
      id: uuid(), name: shopForm.name, price: Number(shopForm.price),
      quantity: shopForm.quantity, date: todayStr(), purchased: false, created_at: now()
    })
    setShopForm({ name: '', price: '', quantity: 1 })
    load()
  }

  const purchaseItem = async (item: ShoppingItem) => {
    await dbUpdate('shopping_items', item.id, { purchased: true })
    await dbInsert('expenses', {
      id: uuid(), type: 'variable', amount: item.price * item.quantity,
      category: '日用品', date: todayStr(), note: `购买: ${item.name}`,
      photo: '', created_at: now()
    })
    load()
  }

  const deleteShop = async (id: string) => {
    await dbDelete('shopping_items', id)
    load()
  }

  const addWish = async () => {
    if (!wishForm.name) return
    await dbInsert('wish_items', {
      id: uuid(), name: wishForm.name, coins: wishForm.coins,
      redeemed: false, date: todayStr(), created_at: now()
    })
    setWishForm({ name: '', coins: 10 })
    load()
  }

  const redeemWish = async (w: WishItem) => {
    await dbUpdate('wish_items', w.id, { redeemed: true })
    load()
  }

  const deleteWish = async (id: string) => {
    await dbDelete('wish_items', id)
    load()
  }

  // 图表数据
  const monthExp = expenses.filter(e => e.date.startsWith(todayStr().slice(0, 7)))
  const weekExpenses = (() => {
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const total = expenses.filter(e => e.date === ds && e.type === 'variable').reduce((s, e) => s + Number(e.amount), 0)
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round(total) })
    }
    return days
  })()

  const categoryData = Object.entries(
    monthExp.filter(e => e.type === 'variable').reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {} as Record<string, number>)
  ).map(([label, value]) => ({ label, value: Math.round(value), color: EXPENSE_COLORS[label] || '#999' }))

  const incomeData = Object.entries(
    monthExp.filter(e => e.type === 'income').reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {} as Record<string, number>)
  ).map(([label, value]) => ({ label, value: Math.round(value), color: EXPENSE_COLORS[label] || '#999' }))

  const monthIncome = monthExp.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const monthExpense = monthExp.filter(e => e.type !== 'income').reduce((s, e) => s + Number(e.amount), 0)
  const balance = monthIncome - monthExpense

  const purchasedItems = shoppingItems.filter(s => s.purchased)
  const unpurchasedItems = shoppingItems.filter(s => !s.purchased)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelWealthIcon size={28} /> 财富工坊</h1>
      </div>

      {/* 五账户体系 */}
      <div className="grid grid-4 mb-4">
        <div className="card text-center">
          <div className="stat-number" style={{ fontSize: 20, color: 'var(--color-moss)' }}>¥{accounts.daily.toFixed(0)}</div>
          <div className="stat-label">日常账户</div>
          <div className="text-sm text-light">额度¥{accounts.dailyLimit}</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ fontSize: 20, color: 'var(--color-warning)' }}>¥{accounts.fixed.toFixed(0)}</div>
          <div className="stat-label">固定支出</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ fontSize: 20, color: 'var(--color-success)' }}>¥{accounts.income.toFixed(0)}</div>
          <div className="stat-label">收入账户</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ fontSize: 20, color: 'var(--color-gold)' }}>{accounts.wish}</div>
          <div className="stat-label">心愿金币</div>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')}>记账</button>
        <button className={`tab-item ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>分析</button>
        <button className={`tab-item ${tab === 'fixed' ? 'active' : ''}`} onClick={() => setTab('fixed')}>固定支出</button>
        <button className={`tab-item ${tab === 'shopping' ? 'active' : ''}`} onClick={() => setTab('shopping')}>购买清单</button>
        <button className={`tab-item ${tab === 'wish' ? 'active' : ''}`} onClick={() => setTab('wish')}>心愿兑换</button>
        <button className={`tab-item ${tab === 'gold' ? 'active' : ''}`} onClick={() => setTab('gold')}>实时金价</button>
      </div>

      {/* 记账 */}
      {tab === 'account' && (
        <div>
          <div className="card mb-3">
            <div className="card-title">快速记账</div>
            <div className="flex gap-2 mb-2">
              {(['variable', 'fixed', 'income'] as const).map(t => (
                <button key={t} onClick={() => setExpForm({ ...expForm, type: t })} className={`btn btn-sm ${expForm.type === t ? 'btn-highlight' : 'btn-outline'}`}>
                  {t === 'variable' ? '可变支出' : t === 'fixed' ? '固定支出' : '收入'}
                </button>
              ))}
            </div>
            <div className="flex gap-1 mb-2 flex-wrap">
              {QUICK_CATEGORIES.map(c => (
                <button key={c} onClick={() => setExpForm({ ...expForm, category: c })} className={`btn btn-sm ${expForm.category === c ? 'btn-primary' : 'btn-outline'}`}>{c}</button>
              ))}
            </div>
            <div className="grid grid-2 gap-2">
              <div className="input-group">
                <label className="input-label">金额</label>
                <input type="number" className="input" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="input-group">
                <label className="input-label">日期</label>
                <input type="date" className="input" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
              </div>
            </div>
            <div className="input-group mt-2">
              <label className="input-label">备注</label>
              <input className="input" value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} placeholder="选填" />
            </div>
            <button className="btn btn-highlight btn-lg w-full mt-2" onClick={addExpense}>记一笔</button>
          </div>

          <div className="card">
            <div className="card-title">最近记录</div>
            {expenses.length === 0 ? <div className="empty-state-text">暂无记录</div> : (
              <div className="flex flex-col gap-1">
                {expenses.slice(0, 20).map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="badge" style={{ background: `${EXPENSE_COLORS[e.category] || '#999'}30`, color: EXPENSE_COLORS[e.category] || '#999' }}>{e.category}</span>
                      <span>{e.note || e.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={e.type === 'income' ? 'text-success' : 'text-danger'} style={{ fontWeight: 600 }}>
                        {e.type === 'income' ? '+' : '-'}¥{Number(e.amount).toFixed(2)}
                      </span>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteExpense(e.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 花销分析 */}
      {tab === 'analysis' && (
        <div>
          <div className="grid grid-2 mb-3">
            <div className="card">
              <div className="card-title">周支出趋势</div>
              <LineChart data={weekExpenses.map(d => d.value)} labels={weekExpenses.map(d => d.label)} color="#5A7A4A" />
            </div>
            <div className="card">
              <div className="card-title">月度支出结构</div>
              <PieChart data={categoryData.length > 0 ? categoryData : [{ label: '暂无', value: 1, color: '#ccc' }]} />
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <div className="card-title">月收入结构</div>
              {incomeData.length > 0 ? <PieChart data={incomeData} color="#66BB6A" /> : <div className="empty-state-text">暂无收入记录</div>}
            </div>
            <div className="card">
              <div className="card-title">本月收支结余</div>
              <div className="text-center" style={{ padding: '20px 0' }}>
                <div className="stat-number" style={{ fontSize: 36, color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}
                </div>
                <div className="stat-label mt-2">收入 ¥{monthIncome.toFixed(2)} - 支出 ¥{monthExpense.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 固定支出管理 */}
      {tab === 'fixed' && (
        <div>
          <div className="card mb-3">
            <div className="card-title">添加固定支出项目</div>
            <div className="grid grid-3 gap-2">
              <input className="input" placeholder="名称(如:房租)" value={fixedForm.name} onChange={e => setFixedForm({ ...fixedForm, name: e.target.value })} />
              <input type="number" className="input" placeholder="金额" value={fixedForm.amount} onChange={e => setFixedForm({ ...fixedForm, amount: e.target.value })} />
              <div className="flex gap-1">
                <input type="number" className="input" placeholder="扣款日" min={1} max={31} value={fixedForm.deductDate} onChange={e => setFixedForm({ ...fixedForm, deductDate: Number(e.target.value) })} style={{ flex: 1 }} />
                <button className="btn btn-highlight" onClick={addFixed}>+</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">固定支出项目</div>
            {fixedExpenses.length === 0 ? <div className="empty-state-text">暂无固定支出项目</div> : (
              <div className="flex flex-col gap-1">
                {fixedExpenses.map(f => (
                  <div key={f.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${f.active ? 'badge-green' : 'badge-gray'}`}>{f.active ? '启用' : '停用'}</span>
                      <span className="text-bold">{f.name}</span>
                      <span className="text-danger">¥{Number(f.amount).toFixed(2)}</span>
                      <span className="text-sm text-light">每月{f.deductDate}日</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-outline" onClick={() => toggleFixed(f)}>{f.active ? '停用' : '启用'}</button>
                      <button className="btn btn-sm btn-outline" onClick={() => skipFixed(f)}>跳过</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteFixed(f.id)}>删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 购买清单 */}
      {tab === 'shopping' && (
        <div>
          <div className="card mb-3">
            <div className="card-title">添加购买清单</div>
            <div className="flex gap-2">
              <input className="input" placeholder="商品名称" value={shopForm.name} onChange={e => setShopForm({ ...shopForm, name: e.target.value })} style={{ flex: 2 }} />
              <input type="number" className="input" placeholder="价格" value={shopForm.price} onChange={e => setShopForm({ ...shopForm, price: e.target.value })} style={{ flex: 1 }} />
              <input type="number" className="input" placeholder="数量" min={1} value={shopForm.quantity} onChange={e => setShopForm({ ...shopForm, quantity: Number(e.target.value) })} style={{ width: 70 }} />
              <button className="btn btn-highlight" onClick={addShopping}>+</button>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <div className="card-title">待购买 ({unpurchasedItems.length})</div>
              <div className="stat-number mb-2" style={{ fontSize: 18 }}>
                小计: ¥{unpurchasedItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
              </div>
              {unpurchasedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <span>{item.name}</span>
                    <span className="text-sm text-light"> ×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-danger">¥{(item.price * item.quantity).toFixed(2)}</span>
                    <button className="btn btn-sm btn-highlight" onClick={() => purchaseItem(item)}>购买</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteShop(item.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">购买历史 ({purchasedItems.length})</div>
              {purchasedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', opacity: 0.7 }}>
                  <div>
                    <span style={{ textDecoration: 'line-through' }}>{item.name}</span>
                    <span className="text-sm text-light"> ×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-light">¥{(item.price * item.quantity).toFixed(2)}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteShop(item.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 心愿兑换 */}
      {tab === 'wish' && (
        <div>
          <div className="card mb-3">
            <div className="card-title">添加心愿</div>
            <div className="flex gap-2">
              <input className="input" placeholder="心愿名称" value={wishForm.name} onChange={e => setWishForm({ ...wishForm, name: e.target.value })} style={{ flex: 2 }} />
              <select className="select" style={{ width: 'auto' }} value={wishForm.coins} onChange={e => setWishForm({ ...wishForm, coins: Number(e.target.value) })}>
                <option value={10}>10 金币</option>
                <option value={20}>20 金币</option>
                <option value={50}>50 金币</option>
                <option value={100}>100 金币</option>
              </select>
              <button className="btn btn-highlight" onClick={addWish}>+</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">心愿清单 (1:1 金币兑换)</div>
            {wishItems.length === 0 ? <div className="empty-state-text">暂无心愿</div> : (
              <div className="flex flex-col gap-1">
                {wishItems.map(w => (
                  <div key={w.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${w.redeemed ? 'badge-gray' : 'badge-gold'}`}>{w.coins} 金币</span>
                      <span style={{ textDecoration: w.redeemed ? 'line-through' : 'none' }}>{w.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {!w.redeemed && <button className="btn btn-sm btn-highlight" onClick={() => redeemWish(w)}>兑换</button>}
                      <button className="btn btn-sm btn-danger" onClick={() => deleteWish(w.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 实时金价 */}
      {tab === 'gold' && (
        <div>
          <div className="card mb-3">
            <div className="flex items-center justify-between">
              <div className="card-title" style={{ marginBottom: 0 }}>实时金价</div>
              <button className="btn btn-sm btn-outline" onClick={refreshGold} disabled={goldLoading}>
                {goldLoading ? '刷新中...' : '↓ 下拉刷新'}
              </button>
            </div>
          </div>

          {goldPrice && (
            <>
              <div className="grid grid-2 mb-3">
                <div className="card text-center">
                  <div className="stat-number" style={{ fontSize: 24 }}>${goldPrice.international.toFixed(2)}</div>
                  <div className="stat-label">国际金价 (美元/盎司)</div>
                </div>
                <div className="card text-center">
                  <div className="stat-number" style={{ fontSize: 24, color: 'var(--color-gold)' }}>¥{goldPrice.domestic.toFixed(2)}</div>
                  <div className="stat-label">国内金价 (元/克)</div>
                </div>
              </div>
              <div className="grid grid-2 mb-3">
                <div className="card">
                  <div className="stat-number" style={{ fontSize: 18, color: 'var(--color-danger)' }}>¥{goldPrice.high.toFixed(2)}</div>
                  <div className="stat-label">7日最高</div>
                </div>
                <div className="card">
                  <div className="stat-number" style={{ fontSize: 18, color: 'var(--color-success)' }}>¥{goldPrice.low.toFixed(2)}</div>
                  <div className="stat-label">7日最低</div>
                </div>
              </div>
              <div className="card mb-3">
                <div className="card-title">7日走势</div>
                <LineChart data={goldPrice.history7d} color="#D4A03A" labels={Array.from({ length: 7 }, (_, i) => `${i + 1}天前`).reverse()} />
              </div>
              <div className="card mb-3">
                <div className="card-title">30日走势</div>
                <LineChart data={goldPrice.history30d} color="#D4A03A" height={100} />
              </div>
              <div className="card">
                <div className="card-title">金价提醒</div>
                <div className="flex gap-2">
                  <input type="number" className="input" placeholder="设置目标价 (元/克)" value={goldAlertPrice} onChange={e => setGoldAlertPrice(e.target.value ? Number(e.target.value) : '')} />
                  <button className="btn btn-highlight" onClick={() => alert(`已设置金价提醒: ¥${goldAlertPrice}/克`)}>设置提醒</button>
                </div>
                <div className="text-sm text-light mt-2">当前金价 ¥{goldPrice.domestic.toFixed(2)}/克，达到目标价时将推送通知</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
