import { useState } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Crown,
  Flame,
  RefreshCw,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react';
import {
  getDailyCuratedWords,
  getTodayKey,
  getWordOfTheDay,
  speakEnglishText,
  VOCABULARY_LIBRARY,
} from '../data/vocabulary';
import type {
  AppView,
  DailyActivity,
  LearnTab,
  QuizAttempt,
  UserProfile,
  WordProgress,
} from '../types/vocabflow';
import { AdBanner } from './AdBanner';

interface DashboardViewProps {
  profile: UserProfile | null;
  wordProgress: Record<string, WordProgress>;
  quizAttempts: QuizAttempt[];
  dailyActivity: Record<string, DailyActivity>;
  isPremium: boolean;
  isGuestPreview?: boolean;
  getIdToken: () => Promise<string>;
  onToggleMastered: (wordId: string) => Promise<void>;
  onNavigate: (view: AppView, learnTab?: LearnTab) => void;
  onPromptSignIn?: () => void;
}

interface AiCoachingData {
  focusSummary: string;
  recommendedWords: { word: string; reason: string; memoryTip: string }[];
  actionSteps: string[];
}

export function DashboardView({
  profile,
  wordProgress,
  quizAttempts,
  dailyActivity,
  isPremium,
  isGuestPreview,
  getIdToken,
  onToggleMastered,
  onNavigate,
  onPromptSignIn,
}: DashboardViewProps) {
  const [aiCoaching, setAiCoaching] = useState<AiCoachingData | null>(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachingError, setCoachingError] = useState('');

  const wod = getWordOfTheDay();
  const dailySet = getDailyCuratedWords(new Date(), 5);
  const todayKey = getTodayKey();

  const progressValues = Object.values(wordProgress);
  const masteredCount = progressValues.filter((w) => w.status === 'mastered').length;
  const dueReviewCount = progressValues.filter(
    (w) => w.status === 'needs_review' || new Date(w.nextReviewAt).getTime() <= Date.now()
  ).length;

  const avgAccuracy =
    quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + a.accuracy, 0) / quizAttempts.length)
      : 0;

  const dailyGoal = profile?.dailyGoal ?? 10;
  const wordsToday = profile?.dailyStatsDate === todayKey ? profile.wordsLearnedToday : 0;
  const goalPct = Math.min(100, Math.round((wordsToday / dailyGoal) * 100));

  // Build 7-day bar chart data
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const key = getTodayKey(d);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = dailyActivity[key]?.wordsReviewed ?? 0;
    return { key, label, count };
  });
  const maxWeekCount = Math.max(dailyGoal, ...weekDays.map((w) => w.count), 5);

  const loadAiRecommendations = async () => {
    setCoachingLoading(true);
    setCoachingError('');
    try {
      const token = await getIdToken();
      const missedWords = progressValues
        .filter((p) => p.status === 'needs_review' || p.mistakeCount > 0)
        .map((p) => VOCABULARY_LIBRARY.find((w) => w.id === p.wordId)?.word || p.wordId);
      const masteredWords = progressValues
        .filter((p) => p.status === 'mastered')
        .map((p) => VOCABULARY_LIBRARY.find((w) => w.id === p.wordId)?.word || p.wordId);
      const candidates = VOCABULARY_LIBRARY.filter((w) => wordProgress[w.id]?.status !== 'mastered')
        .slice(0, 18)
        .map((w) => ({ word: w.word, category: w.category, level: w.level }));

      const resp = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetLevel: profile?.targetLevel || 'B2',
          missedWords,
          masteredWords,
          streak: profile?.streak || 0,
          availableWords: candidates,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Could not generate personalised recommendations');
      }
      setAiCoaching(data as AiCoachingData);
    } catch (err) {
      setCoachingError(err instanceof Error ? err.message : 'Unable to fetch recommendations');
    } finally {
      setCoachingLoading(false);
    }
  };

  const wodMastered = wordProgress[wod.id]?.status === 'mastered';

  return (
    <div className="space-y-6">
      {/* Header Welcome + Primary Quick Launch */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{isPremium ? 'VocabFlow Premium' : 'VocabFlow Free'}</span>
            <span aria-hidden="true">·</span>
            <span>Target Level {profile?.targetLevel ?? 'B2'}</span>
            <span aria-hidden="true">·</span>
            <span>{VOCABULARY_LIBRARY.length} curated words</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isGuestPreview
              ? 'Explore today’s English vocabulary'
              : `Welcome back, ${profile?.displayName || 'Learner'}`}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {wordsToday >= dailyGoal
              ? 'Daily learning goal completed. Keep momentum with a quick quiz or AI story.'
              : `${Math.max(0, dailyGoal - wordsToday)} more words to complete today’s goal of ${dailyGoal}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isGuestPreview && onPromptSignIn ? (
            <button
              type="button"
              onClick={onPromptSignIn}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
            >
              <span>Sign In to Save Progress</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('learn', 'flashcards')}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
              >
                <span>Practice Flashcards</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('learn', 'quiz')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap"
              >
                <span>Take Quiz</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Streak</span>
            <Flame className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {profile?.streak ?? 0} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Best: {profile?.longestStreak ?? 0} days</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Daily Goal</span>
            <Target className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {wordsToday}/{dailyGoal}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Words Mastered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {masteredCount}
            <span className="text-sm font-normal text-slate-500"> / {VOCABULARY_LIBRARY.length}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">{dueReviewCount} due for review</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Quiz Accuracy</span>
            <Sparkles className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-mono-tabular text-2xl font-bold text-slate-900">
            {quizAttempts.length ? `${avgAccuracy}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {profile?.xp ?? 0} XP · {quizAttempts.length} quizzes
          </p>
        </div>
      </div>

      {/* Main Split: Word of the Day + Weekly Activity */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Word of the Day Spotlight */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-indigo-700">Word of the Day</span>
                <span aria-hidden="true">·</span>
                <span>CEFR {wod.level}</span>
                <span aria-hidden="true">·</span>
                <span>{wod.category}</span>
              </div>
              {!isGuestPreview && (
                <button
                  type="button"
                  onClick={() => onToggleMastered(wod.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    wodMastered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>{wodMastered ? 'Mastered' : 'Mark Mastered'}</span>
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <h2 className="text-3xl font-bold text-slate-900">{wod.word}</h2>
              <span className="font-mono-tabular text-sm text-slate-500">{wod.phonetic}</span>
              <span className="text-xs font-medium text-slate-500 italic">{wod.partOfSpeech}</span>
              <button
                type="button"
                onClick={() => speakEnglishText(`${wod.word}. ${wod.examples[0]}`)}
                aria-label={`Listen to pronunciation and example for ${wod.word}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Listen</span>
              </button>
            </div>

            <p className="mt-3 text-base leading-relaxed text-slate-800">{wod.definition}</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
              <p className="text-xs font-semibold text-slate-500">In context</p>
              {wod.examples.map((ex, idx) => (
                <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                  &ldquo;{ex}&rdquo;
                </p>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-500">Memory Hook</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{wod.memoryHook}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Synonyms &amp; Collocations</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                {wod.synonyms.join(', ')} · {wod.collocations.slice(0, 2).join(', ')}
              </p>
            </div>
          </div>
        </section>

        {/* Weekly Activity & Daily Goal Progress */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Weekly Consistency</h2>
                <p className="text-xs text-slate-500">Words reviewed vs daily target ({dailyGoal})</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Edit Goal
              </button>
            </div>

            <div className="mt-6 flex h-44 items-end justify-between gap-2.5 border-b border-slate-200 pb-3">
              {weekDays.map((day) => {
                const heightPct = Math.max(8, Math.round((day.count / maxWeekCount) * 100));
                const metGoal = day.count >= dailyGoal;
                return (
                  <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono-tabular text-[11px] font-medium text-slate-500">
                      {day.count}
                    </span>
                    <div className="flex h-32 w-full items-end justify-center rounded-md bg-slate-50 p-1">
                      <div
                        className={`w-full max-w-[28px] rounded transition-all duration-300 ${
                          metGoal
                            ? 'bg-emerald-600'
                            : day.count > 0
                            ? 'bg-indigo-600'
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
            <span>Green bars indicate days meeting your {dailyGoal}-word goal.</span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {weekDays.reduce((s, d) => s + d.count, 0)} total
            </span>
          </div>
        </section>
      </div>

      {/* Daily Curated Set + Personalised AI Coach */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Daily 5-Word Curated Set */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Today&apos;s Curated Set</h2>
              <p className="text-xs text-slate-500">Five high-utility words selected for daily practice</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Browse All
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {dailySet.map((item) => {
              const status = wordProgress[item.id]?.status ?? 'new';
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-base font-bold text-slate-900">{item.word}</span>
                      <span className="font-mono-tabular text-xs text-slate-400">{item.phonetic}</span>
                      <span className="text-xs text-slate-500">· {item.level}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{item.simpleMeaning}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => speakEnglishText(item.word)}
                      aria-label={`Pronounce ${item.word}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    {!isGuestPreview && (
                      <button
                        type="button"
                        onClick={() => onToggleMastered(item.id)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          status === 'mastered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'mastered' ? 'Mastered' : 'Mark Known'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Personalised AI Learning Recommendations (Premium) */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Personalised AI Coach</h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {isPremium ? 'Active' : 'Premium'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Gemini analyzes your missed quiz words, CEFR target, and retention rhythm to suggest high-impact focus words.
            </p>

            {isPremium ? (
              <div className="mt-4">
                {!aiCoaching && !coachingLoading && (
                  <button
                    type="button"
                    onClick={loadAiRecommendations}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Personalised Study Plan</span>
                  </button>
                )}

                {coachingLoading && (
                  <div className="space-y-2.5 py-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                    <div className="h-12 w-full animate-pulse rounded bg-slate-100" />
                  </div>
                )}

                {coachingError && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    {coachingError}
                  </div>
                )}

                {aiCoaching && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs leading-relaxed text-slate-700">{aiCoaching.focusSummary}</p>
                    <div className="space-y-2">
                      {aiCoaching.recommendedWords.slice(0, 3).map((rec, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold text-slate-900">{rec.word}</span>
                            <button
                              type="button"
                              onClick={() => speakEnglishText(rec.word)}
                              className="text-slate-500 hover:text-indigo-600"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600">{rec.reason}</p>
                          <p className="mt-1 text-[11px] font-medium text-indigo-700">Tip: {rec.memoryTip}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={loadAiRecommendations}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Refresh Coaching</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-900">Unlock Gemini-Powered Coaching</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Upgrade for ₹49/month to get personalised daily focus recommendations, AI contextual stories, unlimited flashcards &amp; quizzes, and exclusive courses.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('account')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  <span>Upgrade to Premium · ₹49/mo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Free-Tier Non-Intrusive Advertisement (Never shown to Premium users) */}
      {!isPremium && (
        <AdBanner
          slot="dashboard"
          onUpgradeClick={() => (isGuestPreview && onPromptSignIn ? onPromptSignIn() : onNavigate('account'))}
        />
      )}
    </div>
  );
}
