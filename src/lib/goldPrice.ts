/**
 * 金价获取
 */

export interface GoldPrice {
  international: number
  domestic: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  history7d: number[];
  history30d: number[];
  lastUpdate: string;
}

// 使用免费金价 API
export async function fetchGoldPrice(): Promise<GoldPrice> {
  try {
    // gold-api.com 免费接口
    const res = await fetch('https://api.gold-api.com/price/XAU')
    const data = await res.json()
    const intlPrice = data.price // USD per ounce

    // 转换为人民币/克 (1盎司=31.1035克, 汇率约7.2)
    const cnyPerGram = (intlPrice / 31.1035) * 7.2

    // 生成模拟历史数据 (实际应用中可从缓存或其他API获取)
    const history7d = generateHistory(cnyPerGram, 7)
    const history30d = generateHistory(cnyPerGram, 30)

    return {
      international: intlPrice,
      domestic: Math.round(cnyPerGram * 100) / 100,
      change: 0,
      changePercent: 0,
      high: Math.max(...history7d),
      low: Math.min(...history7d),
      history7d,
      history30d,
      lastUpdate: new Date().toISOString()
    }
  } catch (err) {
    // Fallback with cached or mock data
    const cached = localStorage.getItem('cached_gold_price')
    if (cached) return JSON.parse(cached)
    return {
      international: 2400,
      domestic: 555.6,
      change: 0,
      changePercent: 0,
      high: 560,
      low: 550,
      history7d: [552, 554, 551, 555, 553, 556, 555],
      history30d: Array.from({ length: 30 }, (_, i) => 545 + Math.sin(i / 3) * 10),
      lastUpdate: new Date().toISOString()
    }
  }
}

function generateHistory(current: number, days: number): number[] {
  const result: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const variance = (Math.random() - 0.5) * 8
    result.push(Math.round((current - i * 0.2 + variance) * 100) / 100)
  }
  result[result.length - 1] = Math.round(current * 100) / 100
  return result
}
