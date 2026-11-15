import type { CEFRLevel } from '../data/vocabulary';

export type AppView = 'dashboard' | 'learn' | 'library' | 'courses' | 'account';
export type LearnTab = 'flashcards' | 'quiz' | 'revision' | 'stories';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  targetLevel: CEFRLevel;
  dailyGoal: number;
  region: 'IN' | 'INTL';
  streak: number;
  longestStreak: number;
  lastActiveDate: string;
  xp: number;
  wordsLearnedToday: number;
  dailyStatsDate: string;
  flashcardsUsedToday: number;
  quizzesUsedToday: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type WordMasteryStatus = 'new' | 'learning' | 'mastered' | 'needs_review';

export interface WordProgress {
  uid: string;
  wordId: string;
  status: WordMasteryStatus;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  correctCount: number;
  mistakeCount: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  updatedAt?: unknown;
}

export interface VocabCollection {
  uid: string;
  collectionId: string;
  name: string;
  description: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  wordIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface QuizAttempt {
  id?: string;
  uid: string;
  mode: 'meaning' | 'context' | 'synonym' | 'mistake_clinic';
  score: number;
  total: number;
  accuracy: number;
  xpEarned: number;
  missedWordIds: string[];
  createdAt?: unknown;
}

export interface AiStory {
  id?: string;
  uid: string;
  title: string;
  genre: string;
  level: CEFRLevel;
  content: string;
  targetWords: string[];
  createdAt?: unknown;
}

export interface CourseProgress {
  uid: string;
  courseId: string;
  completedModules: string[];
  updatedAt?: unknown;
}

export interface DailyActivity {
  uid: string;
  dateKey: string;
  wordsReviewed: number;
  quizzesCompleted: number;
  xpEarned: number;
  updatedAt?: unknown;
}

export interface SubscriptionState {
  uid: string;
  email: string;
  tier: 'free' | 'premium';
  status: 'inactive' | 'active' | 'cancelled' | 'past_due';
  provider: 'none' | 'razorpay' | 'stripe';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lastOrderId: string | null;
  lastPaymentId: string | null;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  uid: string;
  provider: 'razorpay' | 'stripe';
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'verified' | 'failed';
  mode: 'sandbox' | 'gateway';
  createdAt: string;
}

export const FREE_DAILY_FLASHCARD_LIMIT = 20;
export const FREE_DAILY_QUIZ_LIMIT = 3;
export const FREE_COLLECTION_LIMIT = 2;
