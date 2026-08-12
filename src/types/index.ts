// ===== 通用类型 =====
export type PageId =
  | 'today'
  | 'dailyplan'
   'dailytodo' 
  | 'customers'
  | 'reminders'
  | 'inspiration'
  | 'notes'
  | 'words'
  | 'capsule'
  | 'wealth';

export interface Todo {
  id: string;
  content: string;
  date: string;
  time: string;
  done: boolean;
  created_at: string;
}

export interface DailyPlan {
  export interface SubTask {
  id: string;
  content: string;
  done: boolean;
}

export interface DailyTodo {
  id: string;
  title: string;
  category: 'work' | 'study' | 'life' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'doing' | 'done';
  date: string;
  startTime: string;
  endTime: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  notes: string;
  subTasks: SubTask[];
  created_at: string;
  updated_at: string;
}
  id: string;
  content: string;
  time: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  date: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  status: 'potential' | 'following' | 'signed' | 'lost';
  lastContact: string;
  notes: string;
  created_at: string;
}

export interface Docket {
  id: string;
  customerId: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  type: 'birthday' | 'contact' | 'custom';
  title: string;
  date: string;
  time: string;
  calendar: 'solar' | 'lunar';
  advanceDays: number;
  repeat: 'none' | 'yearly' | 'monthly' | 'weekly';
  notes: string;
  status: 'pending' | 'upcoming' | 'done' | 'overdue';
  created_at: string;
}

export interface Inspiration {
  id: string;
  category: 'book' | 'quote' | 'movie' | 'knowledge' | 'excerpt';
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  tags: string[];
  created_at: string;
}

export interface Excerpt {
  id: string;
  text: string;
  author: string;
  category: 'motivational' | 'philosophy' | 'love' | 'poetry' | 'life';
  created_at: string;
}

export interface DailyNote {
  id: string;
  content: string;
  mood: string;
  photos: string[];
  date: string;
  created_at: string;
}

export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  examples: { en: string; zh: string }[];
  learnedDate: string;
  reviewed: boolean;
  mastered: boolean;
}

// ===== 小孩成长记录 =====
export interface ChildInfo {
  name: string;
  gender: 'boy' | 'girl';
  birthDate: string;
}

export interface GrowthMetric {
  id: string;
  date: string;
  height: number;
  weight: number;
  note: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: string;
  photos: string[];
  created_at: string;
}

export interface GrowthDiary {
  id: string;
  content: string;
  photos: string[];
  mood: string;
  date: string;
  created_at: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  category: 'work' | 'study' | 'life' | 'inspiration' | 'other';
  photos: string[];
  tags: string[];
  pinned: boolean;
  remindAt: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  type: 'variable' | 'fixed' | 'income';
  amount: number;
  category: string;
  date: string;
  note: string;
  photo: string;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  deductDate: number;
  active: boolean;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  date: string;
  purchased: boolean;
  created_at: string;
}

export interface WishItem {
  id: string;
  name: string;
  coins: number;
  redeemed: boolean;
  date: string;
  created_at: string;
}

export interface Account {
  id: string;
  type: 'daily' | 'fixed' | 'income' | 'wish' | 'gold';
  name: string;
  balance: number;
  monthlyLimit: number;
  resetDate: string;
}

export interface FiveAccounts {
  daily: { balance: number; monthlyLimit: number; resetDate: string };
  fixed: { balance: number };
  income: { balance: number };
  wish: { balance: number };
  gold: { balance: number };
}
