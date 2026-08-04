import { useState, useEffect, useRef } from 'react'
import { dbGet, dbInsert, dbUpdate, uuid, todayStr } from '../lib/db'
import type { WordItem } from '../types'
import { PixelWordIcon, PixelLeaf } from '../components/PixelIcon'

const WORD_BANK: Omit<WordItem, 'id' | 'learnedDate' | 'reviewed' | 'mastered'>[] = [
  { word: 'serendipity', phonetic: '/serendipiti/', translation: 'n. 意外发现美好事物的能力；机缘巧合', examples: [
    { en: 'Meeting her was pure serendipity.', zh: '遇见她纯属机缘巧合。' },
    { en: 'The discovery was a happy serendipity.', zh: '这个发现是一个令人愉快的意外。' }
  ]},
  { word: 'resilience', phonetic: '/rizilians/', translation: 'n. 恢复力；韧性；适应力', examples: [
    { en: 'She showed great resilience after the setback.', zh: '她在挫折后展现了极大的韧性。' },
    { en: 'The resilience of nature is remarkable.', zh: '大自然的恢复力是惊人的。' }
  ]},
  { word: 'ephemeral', phonetic: '/ifemeral/', translation: 'adj. 短暂的；转瞬即逝的', examples: [
    { en: 'Fame can be ephemeral.', zh: '名声可能是转瞬即逝的。' },
    { en: 'Cherry blossoms are ephemeral but beautiful.', zh: '樱花短暂但美丽。' }
  ]},
  { word: 'nostalgia', phonetic: '/nostaldza/', translation: 'n. 怀旧；乡愁', examples: [
    { en: 'The old photos filled him with nostalgia.', zh: '老照片让他满怀怀旧之情。' },
    { en: 'Nostalgia for childhood is universal.', zh: '对童年的怀念是普遍的。' }
  ]},
  { word: 'eloquent', phonetic: '/elakwent/', translation: 'adj. 雄辩的；有说服力的', examples: [
    { en: 'She gave an eloquent speech.', zh: '她发表了一篇雄辩的演讲。' },
    { en: 'His silence was more eloquent than words.', zh: '他的沉默比言语更有说服力。' }
  ]},
  { word: 'tranquil', phonetic: '/traenkwil/', translation: 'adj. 平静的；安宁的', examples: [
    { en: 'The lake was tranquil at dawn.', zh: '黎明时湖面平静。' },
    { en: 'She led a tranquil life in the countryside.', zh: '她在乡下过着宁静的生活。' }
  ]},
  { word: 'meticulous', phonetic: '/mitikjales/', translation: 'adj. 一丝不苟的；细心的', examples: [
    { en: 'He is meticulous about details.', zh: '他对细节一丝不苟。' },
    { en: 'Her meticulous research impressed everyone.', zh: '她细致的研究令所有人印象深刻。' }
  ]},
  { word: 'profound', phonetic: '/profaund/', translation: 'adj. 深刻的；深远的', examples: [
    { en: 'The book had a profound impact on me.', zh: '这本书对我有深远的影响。' },
    { en: 'She felt a profound sense of loss.', zh: '她感到深深的失落。' }
  ]},
  { word: 'vibrant', phonetic: '/vaibrent/', translation: 'adj. 充满活力的；鲜艳的', examples: [
    { en: 'The city has a vibrant nightlife.', zh: '这座城市有充满活力的夜生活。' },
    { en: 'She wore a vibrant red dress.', zh: '她穿着一件鲜艳的红裙。' }
  ]},
  { word: 'contemplate', phonetic: '/kontempleit/', translation: 'v. 沉思；考虑', examples: [
    { en: 'He contemplated the meaning of life.', zh: '他沉思生命的意义。' },
    { en: 'She contemplated changing her career.', zh: '她考虑换职业。' }
  ]},
  { word: 'abundant', phonetic: '/abandent/', translation: 'adj. 丰富的；充裕的', examples: [
    { en: 'The region has abundant natural resources.', zh: '该地区有丰富的自然资源。' },
    { en: 'Food was abundant at the feast.', zh: '宴会上食物充裕。' }
  ]},
  { word: 'genuine', phonetic: '/dzenjuin/', translation: 'adj. 真正的；真诚的', examples: [
    { en: 'Her smile was genuine.', zh: '她的微笑是真诚的。' },
    { en: 'This is a genuine diamond.', zh: '这是一颗真正的钻石。' }
  ]},
  { word: 'whimsical', phonetic: '/wimzikl/', translation: 'adj. 异想天开的；古怪的', examples: [
    { en: 'The artist has a whimsical style.', zh: '这位艺术家有异想天开的风格。' },
    { en: 'She bought a whimsical hat.', zh: '她买了一顶古怪的帽子。' }
  ]},
  { word: 'diligent', phonetic: '/dilidzent/', translation: 'adj. 勤奋的；用功的', examples: [
    { en: 'He is a diligent student.', zh: '他是一个勤奋的学生。' },
    { en: 'Diligent work leads to success.', zh: '勤奋的工作带来成功。' }
  ]},
  { word: 'serene', phonetic: '/serin/', translation: 'adj. 宁静的；安详的', examples: [
    { en: 'The garden was serene and peaceful.', zh: '花园宁静祥和。' },
    { en: 'She had a serene expression.', zh: '她表情安详。' }
  ]},
]

export default function WordLearning() {
  const [learnedWords, setLearnedWords] = useState<WordItem[]>([])
  const [todayNew, setTodayNew] = useState<WordItem[]>([])
  const [reviewWords, setReviewWords] = useState<WordItem[]>([])
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [totalLearned, setTotalLearned] = useState(0)
  const [streak, setStreak] = useState(0)
  const recognitionRef = useRef<any>(null)

  const load = async () => {
    const data = await dbGet<WordItem[]>('words') as WordItem[]
    setLearnedWords(data)
    setTotalLearned(data.length)

    const today = todayStr()
    const todayLearned = data.filter(w => w.learnedDate === today)

    if (todayLearned.length < 5) {
      const learnedSet = new Set(data.map(w => w.word))
      const available = WORD_BANK.filter(w => !learnedSet.has(w.word))
      const newWords = available.slice(0, 5 - todayLearned.length).map(w => ({
        ...w, id: uuid(), learnedDate: today, reviewed: false, mastered: false
      }))
      setTodayNew([...todayLearned, ...newWords])
    } else {
      setTodayNew(todayLearned.slice(0, 5))
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]
    const review = data.filter(w => w.learnedDate === yStr && !w.reviewed).slice(0, 5)
    setReviewWords(review)

    const dates = [...new Set(data.map(w => w.learnedDate))].sort().reverse()
    let s = 0
    let checkDate = new Date()
    for (let i = 0; i < dates.length; i++) {
      const dStr = checkDate.toISOString().split('T')[0]
      if (dates.includes(dStr)) {
        s++
        checkDate.setDate(checkDate.getDate() - 1)
      } else break
    }
    setStreak(s)
  }

  useEffect(() => { load() }, [])

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'en-US'
      utter.rate = 0.8
      window.speechSynthesis.speak(utter)
    }
  }

  const startRecognition = (word: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('您的浏览器不支持语音识别，请使用Chrome')
      return
    }
    if (recognitionRef.current) recognitionRef.current.stop()
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e: any) => {
      const result = e.results[0][0].transcript.toLowerCase().trim()
      const target = word.toLowerCase().trim()
      if (result === target || result.includes(target)) {
        alert('发音正确!')
      } else {
        alert('你说的是 "' + result + '"，目标词是 "' + word + '"，继续练习!')
      }
    }
    recognition.onerror = () => alert('语音识别出错，请重试')
    recognition.start()
    recognitionRef.current = recognition
  }

  const markLearned = async (word: WordItem) => {
    if (learnedWords.find(w => w.id === word.id)) {
      await dbUpdate('words', word.id, { reviewed: true, mastered: true })
    } else {
      await dbInsert('words', word)
    }
    setShowAnswer(false)
    setCurrentWord(null)
    load()
  }

  const pendingWords = [...todayNew.filter(w => !learnedWords.find(lw => lw.id === w.id && lw.mastered)), ...reviewWords.filter(w => !w.reviewed)]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><PixelWordIcon size={28} /> 单词学习</h1>
      </div>

      <div className="grid grid-3 mb-4">
        <div className="card text-center">
          <div className="stat-number">{totalLearned}</div>
          <div className="stat-label">累计学习</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ color: 'var(--color-highlight)' }}>{pendingWords.length}</div>
          <div className="stat-label">今日待学</div>
        </div>
        <div className="card text-center">
          <div className="stat-number" style={{ color: 'var(--color-gold)' }}>{streak}</div>
          <div className="stat-label">连续天数</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-title">
          <PixelLeaf size={16} /> 今日学习计划
          <span className="badge badge-green ml-auto">
            新词 {todayNew.filter(w => learnedWords.find(lw => lw.id === w.id)).length}/{todayNew.length}
            {' | '}复习 {reviewWords.filter(w => w.reviewed).length}/{reviewWords.length}
          </span>
        </div>
        {pendingWords.length === 0 ? (
          <div className="empty-state">
            <PixelWordIcon size={48} />
            <p className="empty-state-text">今日学习已完成! 获得5金币奖励</p>
          </div>
        ) : (
          <button className="btn btn-highlight btn-lg w-full" onClick={() => { setCurrentWord(pendingWords[0]); setShowAnswer(false) }}>
            开始学习 ({pendingWords.length} 个)
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-title">学习记录</div>
        {learnedWords.length === 0 ? (
          <div className="empty-state-text">暂无学习记录</div>
        ) : (
          <div className="flex flex-col gap-1">
            {learnedWords.slice(-10).reverse().map(w => (
              <div key={w.id} className="flex items-center justify-between text-sm" style={{ padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-bold">{w.word}</span>
                <span className="text-light">{w.translation.slice(0, 20)}...</span>
                <span className={'badge ' + (w.mastered ? 'badge-green' : 'badge-gray')}>{w.mastered ? '已掌握' : '学习中'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentWord && (
        <div className="modal-overlay" onClick={() => setCurrentWord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title">单词学习</span>
              <button className="modal-close" onClick={() => setCurrentWord(null)}>×</button>
            </div>
            <div className="text-center" style={{ padding: '20px 0' }}>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>{currentWord.word}</h2>
              <p style={{ fontSize: 16, color: 'var(--color-text-light)' }}>{currentWord.phonetic}</p>
              <div className="flex justify-center gap-2 mt-3">
                <button className="btn btn-outline" onClick={() => speak(currentWord.word)}>发音</button>
                <button className="btn btn-outline" onClick={() => startRecognition(currentWord.word)}>跟读</button>
              </div>
            </div>

            {showAnswer ? (
              <div>
                <div className="card mb-3" style={{ background: 'rgba(125,191,138,0.1)' }}>
                  <div className="text-bold mb-2">释义</div>
                  <div style={{ fontSize: 15 }}>{currentWord.translation}</div>
                </div>
                <div className="card mb-3">
                  <div className="text-bold mb-2">例句</div>
                  {currentWord.examples.map((ex, i) => (
                    <div key={i} className="mb-2">
                      <div style={{ fontSize: 14 }}>
                        {ex.en}
                        <button onClick={() => speak(ex.en)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-secondary)' }}>音</button>
                      </div>
                      <div className="text-sm text-light">{ex.zh}</div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg w-full" onClick={() => markLearned(currentWord)}>
                  已学会，下一个
                </button>
              </div>
            ) : (
              <button className="btn btn-highlight btn-lg w-full" onClick={() => setShowAnswer(true)}>
                点击查看释义
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
