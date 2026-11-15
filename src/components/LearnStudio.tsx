import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Crown,
  Layers,
  Lock,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  getTodayKey,
  speakEnglishText,
  VOCABULARY_LIBRARY,
  type CEFRLevel,
  type VocabWord,
} from '../data/vocabulary';
import {
  FREE_DAILY_FLASHCARD_LIMIT,
  FREE_DAILY_QUIZ_LIMIT,
  type AiStory,
  type AppView,
  type LearnTab,
  type QuizAttempt,
  type UserProfile,
  type VocabCollection,
  type WordProgress,
} from '../types/vocabflow';

interface LearnStudioProps {
  activeTab: LearnTab;
  onTabChange: (tab: LearnTab) => void;
  profile: UserProfile | null;
  wordProgress: Record<string, WordProgress>;
  collections: VocabCollection[];
  quizAttempts: QuizAttempt[];
  stories: AiStory[];
  isPremium: boolean;
  getIdToken: () => Promise<string>;
  onRecordReview: (wordId: string, quality: 1 | 2 | 3 | 4, countsTowardQuota?: boolean) => Promise<void>;
  onSaveQuizAttempt: (attempt: Omit<QuizAttempt, 'uid' | 'createdAt' | 'id'>) => Promise<void>;
  onSaveAiStory: (story: Omit<AiStory, 'uid' | 'createdAt' | 'id'>) => Promise<void>;
  onNavigate: (view: AppView) => void;
}

interface QuizQuestion {
  word: VocabWord;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const STORY_GENRES = ['Mystery', 'Workplace Drama', 'Sci-Fi Dispatch', 'Literary Essay'];

export function LearnStudio({
  activeTab,
  onTabChange,
  profile,
  wordProgress,
  collections,
  quizAttempts,
  stories,
  isPremium,
  getIdToken,
  onRecordReview,
  onSaveQuizAttempt,
  onSaveAiStory,
  onNavigate,
}: LearnStudioProps) {
  const todayKey = getTodayKey();
  const flashcardsUsedToday = profile?.dailyStatsDate === todayKey ? profile.flashcardsUsedToday : 0;
  const quizzesUsedToday = profile?.dailyStatsDate === todayKey ? profile.quizzesUsedToday : 0;

  const flashcardLimitReached = !isPremium && flashcardsUsedToday >= FREE_DAILY_FLASHCARD_LIMIT;
  const quizLimitReached = !isPremium && quizzesUsedToday >= FREE_DAILY_QUIZ_LIMIT;

  // --- FLASHCARD STATE ---
  const [deckScope, setDeckScope] = useState<string>('all');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState(0);

  const flashcardDeck = useMemo(() => {
    let pool = VOCABULARY_LIBRARY;
    if (deckScope === 'due') {
      const due = VOCABULARY_LIBRARY.filter((w) => {
        const p = wordProgress[w.id];
        return !p || p.status === 'needs_review' || new Date(p.nextReviewAt).getTime() <= Date.now();
      });
      pool = due.length > 0 ? due : VOCABULARY_LIBRARY;
    } else if (deckScope.startsWith('col:')) {
      const colId = deckScope.slice(4);
      const col = collections.find((c) => c.collectionId === colId);
      if (col && col.wordIds.length > 0) {
        pool = VOCABULARY_LIBRARY.filter((w) => col.wordIds.includes(w.id));
      }
    } else if (deckScope !== 'all') {
      pool = VOCABULARY_LIBRARY.filter((w) => w.level === deckScope);
    }
    return pool.length > 0 ? pool : VOCABULARY_LIBRARY;
  }, [collections, deckScope, wordProgress]);

  const currentCard = flashcardDeck[cardIndex % flashcardDeck.length];

  const handleRateCard = async (quality: 1 | 2 | 3 | 4) => {
    if (!currentCard || flashcardLimitReached) return;
    await onRecordReview(currentCard.id, quality, true);
    setSessionReviewed((c) => c + 1);
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
  };

  // Keyboard shortcuts for Flashcards
  useEffect(() => {
    if (activeTab !== 'flashcards') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped && !flashcardLimitReached) {
        if (e.key === '1') void handleRateCard(1);
        if (e.key === '2') void handleRateCard(2);
        if (e.key === '3') void handleRateCard(3);
        if (e.key === '4') void handleRateCard(4);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // --- QUIZ STATE ---
  const [quizMode, setQuizMode] = useState<'meaning' | 'context' | 'synonym' | 'mistake_clinic'>('meaning');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  const startNewQuiz = (modeToStart = quizMode) => {
    if (quizLimitReached) return;
    if (modeToStart === 'mistake_clinic' && !isPremium) return;

    let pool = [...VOCABULARY_LIBRARY];
    if (modeToStart === 'mistake_clinic') {
      const weak = pool.filter((w) => {
        const p = wordProgress[w.id];
        return p && (p.status === 'needs_review' || p.mistakeCount > 0);
      });
      if (weak.length >= 3) pool = weak;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    const built: QuizQuestion[] = shuffled.map((word) => {
      const distractors = VOCABULARY_LIBRARY.filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      if (modeToStart === 'context') {
        const sentence = word.examples[0];
        const regex = new RegExp(`\\b${word.word}\\w*\\b`, 'i');
        const blanked = regex.test(sentence) ? sentence.replace(regex, '______') : `${sentence} (Target: ______)`;
        const options = [word.word, ...distractors.map((d) => d.word)].sort(() => Math.random() - 0.5);
        return {
          word,
          prompt: blanked,
          options,
          correctAnswer: word.word,
          explanation: `${word.word} (${word.partOfSpeech}): ${word.simpleMeaning}`,
        };
      }

      if (modeToStart === 'synonym') {
        const correctSyn = word.synonyms[0];
        const options = [correctSyn, ...distractors.map((d) => d.synonyms[0])].sort(() => Math.random() - 0.5);
        return {
          word,
          prompt: `Choose the closest synonym for "${word.word}" (${word.phonetic})`,
          options,
          correctAnswer: correctSyn,
          explanation: `${word.word} means "${word.simpleMeaning}". Synonyms: ${word.synonyms.join(', ')}.`,
        };
      }

      const options = [word.simpleMeaning, ...distractors.map((d) => d.simpleMeaning)].sort(() => Math.random() - 0.5);
      return {
        word,
        prompt: `What is the clearest meaning of "${word.word}"?`,
        options,
        correctAnswer: word.simpleMeaning,
        explanation: `${word.word}: ${word.definition}`,
      };
    });

    setQuizMode(modeToStart);
    setQuizQuestions(built);
    setQIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setMissedIds([]);
    setQuizFinished(false);
  };

  const handleSelectOption = (opt: string) => {
    if (selectedAnswer !== null) return;
    const currentQ = quizQuestions[qIndex];
    setSelectedAnswer(opt);
    if (opt === currentQ.correctAnswer) {
      setScore((s) => s + 1);
    } else {
      setMissedIds((prev) => [...prev, currentQ.word.id]);
    }
  };

  const handleNextQuestion = async () => {
    const isLast = qIndex + 1 >= quizQuestions.length;
    if (!isLast) {
      setQIndex((i) => i + 1);
      setSelectedAnswer(null);
      return;
    }

    setQuizFinished(true);
    const total = quizQuestions.length;
    const accuracy = Math.round((score / total) * 100);
    const xpEarned = score * 20 + (accuracy === 100 ? 30 : 0);
    await onSaveQuizAttempt({
      mode: quizMode,
      score,
      total,
      accuracy,
      xpEarned,
      missedWordIds: missedIds,
    });
  };

  // --- AI STORY STUDIO STATE (PREMIUM) ---
  const [selectedStoryWords, setSelectedStoryWords] = useState<string[]>([
    'ephemeral',
    'pragmatic',
    'serendipity',
    'lucid',
  ]);
  const [storyGenre, setStoryGenre] = useState('Mystery');
  const [storyLevel, setStoryLevel] = useState<CEFRLevel>('C1');
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [generatedStory, setGeneratedStory] = useState<{
    title: string;
    story: string;
    wordNotes: { word: string; usageNote: string }[];
    targetWords: string[];
  } | null>(null);
  const [inspectedWord, setInspectedWord] = useState<VocabWord | null>(null);
  const [storySavedMsg, setStorySavedMsg] = useState('');

  const toggleStoryWord = (word: string) => {
    setSelectedStoryWords((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 8) return prev;
      return [...prev, word];
    });
  };

  const handleGenerateStory = async () => {
    setStoryError('');
    setStorySavedMsg('');
    setStoryLoading(true);
    try {
      const token = await getIdToken();
      const resp = await fetch('/api/ai/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          words: selectedStoryWords,
          genre: storyGenre,
          level: storyLevel,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Could not generate story');
      }
      setGeneratedStory(data);
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : 'Story generation failed');
    } finally {
      setStoryLoading(false);
    }
  };

  const handleSaveStory = async () => {
    if (!generatedStory) return;
    await onSaveAiStory({
      title: generatedStory.title,
      genre: storyGenre,
      level: storyLevel,
      content: generatedStory.story,
      targetWords: generatedStory.targetWords,
    });
    setStorySavedMsg('Saved to your story archive');
  };

  // Helper to highlight target words inside AI story prose
  const renderHighlightedStory = (text: string, targets: string[]) => {
    if (!targets.length) return text;
    const escaped = targets.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) => {
      const matched = VOCABULARY_LIBRARY.find(
        (w) => w.word.toLowerCase() === part.toLowerCase()
      );
      if (matched) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => setInspectedWord(matched)}
            className="mx-0.5 inline rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 transition-colors hover:bg-indigo-100"
          >
            {part}
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // --- REVISION & ANALYTICS COMPUTATIONS ---
  const overdueWords = useMemo(() => {
    return VOCABULARY_LIBRARY.filter((w) => {
      const p = wordProgress[w.id];
      return p && (p.status === 'needs_review' || new Date(p.nextReviewAt).getTime() <= Date.now());
    });
  }, [wordProgress]);

  const cefrBreakdown = useMemo(() => {
    const levels: CEFRLevel[] = ['B1', 'B2', 'C1', 'C2'];
    return levels.map((lvl) => {
      const total = VOCABULARY_LIBRARY.filter((w) => w.level === lvl).length;
      const mastered = VOCABULARY_LIBRARY.filter(
        (w) => w.level === lvl && wordProgress[w.id]?.status === 'mastered'
      ).length;
      return { lvl, total, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
    });
  }, [wordProgress]);

  return (
    <div className="space-y-6">
      {/* Studio Mode Switcher — Zero Ads Guaranteed */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onTabChange('flashcards')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Flashcards</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('quiz')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Adaptive Quiz</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('stories')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'stories'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Stories</span>
            {!isPremium && <Lock className="h-3 w-3 text-amber-600" />}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('revision')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'revision'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Revision &amp; Stats</span>
            {!isPremium && <Lock className="h-3 w-3 text-amber-600" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Distraction-free learning studio</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular font-medium text-slate-700">
            {isPremium
              ? 'Unlimited practice'
              : activeTab === 'flashcards'
              ? `${Math.max(0, FREE_DAILY_FLASHCARD_LIMIT - flashcardsUsedToday)}/${FREE_DAILY_FLASHCARD_LIMIT} cards left today`
              : activeTab === 'quiz'
              ? `${Math.max(0, FREE_DAILY_QUIZ_LIMIT - quizzesUsedToday)}/${FREE_DAILY_QUIZ_LIMIT} quizzes left today`
              : 'Premium preview'}
          </span>
        </div>
      </div>

      {/* 1. FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="deck-scope" className="text-xs font-semibold text-slate-600">
                  Deck:
                </label>
                <select
                  id="deck-scope"
                  value={deckScope}
                  onChange={(e) => {
                    setDeckScope(e.target.value);
                    setCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all">All Vocabulary ({VOCABULARY_LIBRARY.length})</option>
                  <option value="due">Due &amp; Needs Review</option>
                  <option value="B1">CEFR B1</option>
                  <option value="B2">CEFR B2</option>
                  <option value="C1">CEFR C1</option>
                  <option value="C2">CEFR C2</option>
                  {collections.map((c) => (
                    <option key={c.collectionId} value={`col:${c.collectionId}`}>
                      List: {c.name} ({c.wordIds.length})
                    </option>
                  ))}
                </select>
              </div>
              <span className="font-mono-tabular text-xs text-slate-500">
                Card {(cardIndex % flashcardDeck.length) + 1} of {flashcardDeck.length} · Reviewed {sessionReviewed} this session
              </span>
            </div>

            {flashcardLimitReached ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <Crown className="mx-auto h-8 w-8 text-amber-600" />
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  Daily Free Flashcard Limit Reached ({FREE_DAILY_FLASHCARD_LIMIT}/{FREE_DAILY_FLASHCARD_LIMIT})
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  Great focus today. Your free quota resets tomorrow, or upgrade to VocabFlow Premium for ₹49/month for unlimited flashcards and spaced repetition.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('account')}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <span>Unlock Unlimited Flashcards · ₹49/mo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="perspective-1000">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsFlipped((f) => !f)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsFlipped((f) => !f);
                  }}
                  className="relative min-h-[340px] cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 transition-transform duration-200 hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {!isFlipped ? (
                    <div className="flex h-full min-h-[260px] flex-col justify-between">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {currentCard.level} · {currentCard.category} · {currentCard.partOfSpeech}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglishText(currentCard.word);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Speak</span>
                        </button>
                      </div>

                      <div className="my-auto py-8 text-center">
                        <p className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                          {currentCard.word}
                        </p>
                        <p className="mt-2 font-mono-tabular text-base text-slate-500">
                          {currentCard.phonetic}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <span>Click card or press Space to reveal meaning</span>
                        <span className="font-semibold text-indigo-600">Flip Card →</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[260px] flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-display text-2xl font-bold text-slate-900">
                            {currentCard.word}
                          </span>
                          <span className="font-mono-tabular text-xs text-slate-500">
                            {currentCard.phonetic}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakEnglishText(`${currentCard.word}. ${currentCard.examples[0]}`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Example Audio</span>
                        </button>
                      </div>

                      <div className="my-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-indigo-700">Definition</p>
                          <p className="mt-1 text-base font-medium leading-relaxed text-slate-900">
                            {currentCard.definition}
                          </p>
                        </div>

                        <div className="rounded-xl bg-sky-50/70 border border-sky-200/70 p-3.5">
                          <p className="text-xs font-semibold text-sky-900">Example</p>
                          <p className="mt-1 text-sm text-slate-800">&ldquo;{currentCard.examples[0]}&rdquo;</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                          <div>
                            <span className="font-semibold text-slate-500">Synonyms: </span>
                            <span className="text-slate-700">{currentCard.synonyms.join(', ')}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Memory Hook: </span>
                            <span className="text-slate-700">{currentCard.memoryHook}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 text-right text-xs text-slate-400">
                        Rate recall confidence below (keys 1–4)
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Controls */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    disabled={!isFlipped}
                    onClick={() => handleRateCard(1)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-left transition-colors hover:bg-rose-100 disabled:opacity-40"
                  >
                    <span className="block text-xs font-bold text-rose-800">1 · Again</span>
                    <span className="mt-0.5 block text-[11px] text-rose-700">Review soon</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isFlipped}
                    onClick={() => handleRateCard(2)}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left transition-colors hover:bg-amber-100 disabled:opacity-40"
                  >
                    <span className="block text-xs font-bold text-amber-800">2 · Hard</span>
                    <span className="mt-0.5 block text-[11px] text-amber-700">1–2 days</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isFlipped}
                    onClick={() => handleRateCard(3)}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3 text-left transition-colors hover:bg-indigo-100 disabled:opacity-40"
                  >
                    <span className="block text-xs font-bold text-indigo-800">3 · Good</span>
                    <span className="mt-0.5 block text-[11px] text-indigo-700">3–6 days</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isFlipped}
                    onClick={() => handleRateCard(4)}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left transition-colors hover:bg-emerald-100 disabled:opacity-40"
                  >
                    <span className="block text-xs font-bold text-emerald-800">4 · Easy</span>
                    <span className="mt-0.5 block text-[11px] text-emerald-700">7+ days</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Deck Context */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-4 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Word Anatomy</h3>
              <p className="mt-1 text-xs text-slate-500">Etymology and natural collocations</p>
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                  <p className="font-semibold text-slate-700">Etymology</p>
                  <p className="mt-1 leading-relaxed text-slate-600">{currentCard.etymology}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                  <p className="font-semibold text-slate-700">Common Collocations</p>
                  <p className="mt-1 leading-relaxed text-slate-600">{currentCard.collocations.join(' · ')}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
                  <p className="font-semibold text-slate-700">Antonyms</p>
                  <p className="mt-1 leading-relaxed text-slate-600">{currentCard.antonyms.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-900">Keyboard Shortcuts</p>
              <p>Space: Flip card · 1–4: Rate mastery</p>
            </div>
          </aside>
        </div>
      )}

      {/* 2. ADAPTIVE QUIZ */}
      {activeTab === 'quiz' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {quizLimitReached && quizQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <Crown className="mx-auto h-8 w-8 text-amber-600" />
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                Daily Free Quiz Limit Reached ({FREE_DAILY_QUIZ_LIMIT}/{FREE_DAILY_QUIZ_LIMIT})
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                You completed all {FREE_DAILY_QUIZ_LIMIT} free quizzes today. Upgrade to Premium (₹49/mo) for unlimited quizzes and Mistake Clinic drills.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <span>Upgrade to Premium · ₹49/mo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : quizQuestions.length === 0 ? (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose a Quiz Mode</h2>
              <p className="mt-1 text-sm text-slate-600">
                5 adaptive questions per round. Missed words are automatically queued for spaced revision.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => startNewQuiz('meaning')}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
                >
                  <p className="font-display text-base font-bold text-slate-900">Meaning Match</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Identify the clearest definition for B1–C2 target words.
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-indigo-600">Start 5-Word Quiz →</span>
                </button>

                <button
                  type="button"
                  onClick={() => startNewQuiz('context')}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
                >
                  <p className="font-display text-base font-bold text-slate-900">Context Cloze</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Complete realistic workplace and literary sentences accurately.
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-emerald-700">Start Context Quiz →</span>
                </button>

                <button
                  type="button"
                  onClick={() => startNewQuiz('synonym')}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition-colors hover:border-sky-400 hover:bg-sky-50/40"
                >
                  <p className="font-display text-base font-bold text-slate-900">Synonym Precision</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Sharpen nuance by pairing words with their closest synonyms.
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-sky-700">Start Synonym Quiz →</span>
                </button>

                <button
                  type="button"
                  onClick={() => (isPremium ? startNewQuiz('mistake_clinic') : onNavigate('account'))}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-left transition-colors hover:border-amber-400"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-bold text-slate-900">Mistake Clinic</p>
                    {!isPremium && <Lock className="h-3.5 w-3.5 text-amber-600" />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Targeted drill built from words you missed previously.
                  </p>
                  <span className="mt-4 inline-block text-xs font-semibold text-amber-800">
                    {isPremium ? 'Start Mistake Drill →' : 'Premium Feature →'}
                  </span>
                </button>
              </div>
            </div>
          ) : quizFinished ? (
            <div className="mx-auto max-w-xl py-4 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Quiz Complete: {score}/{quizQuestions.length} Correct
              </h2>
              <p className="mt-1 font-mono-tabular text-sm text-slate-600">
                Accuracy: {Math.round((score / quizQuestions.length) * 100)}% · +{score * 20} XP earned
              </p>

              {missedIds.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                  <p className="text-xs font-semibold text-slate-700">Queued for spaced revision:</p>
                  <div className="mt-2 space-y-2">
                    {missedIds.map((id) => {
                      const w = VOCABULARY_LIBRARY.find((item) => item.id === id);
                      if (!w) return null;
                      return (
                        <div key={id} className="text-xs text-slate-700">
                          <span className="font-bold text-slate-900">{w.word}</span> — {w.simpleMeaning}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuizQuestions([])}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Choose Another Mode</span>
                </button>
                {!quizLimitReached && (
                  <button
                    type="button"
                    onClick={() => startNewQuiz(quizMode)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <span>Play Again</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Question {qIndex + 1} of {quizQuestions.length} · {quizMode.replace('_', ' ')}
                </span>
                <span className="font-mono-tabular font-semibold text-slate-700">Score: {score}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${((qIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              <div className="mt-6 flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold leading-snug text-slate-900">
                  {quizQuestions[qIndex].prompt}
                </h3>
                <button
                  type="button"
                  onClick={() => speakEnglishText(quizQuestions[qIndex].word.word)}
                  aria-label="Hear target word"
                  className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {quizQuestions[qIndex].options.map((opt) => {
                  const isAnswered = selectedAnswer !== null;
                  const isCorrect = opt === quizQuestions[qIndex].correctAnswer;
                  const isPicked = opt === selectedAnswer;

                  let style =
                    'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40';
                  if (isAnswered) {
                    if (isCorrect) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                    } else if (isPicked) {
                      style = 'border-rose-500 bg-rose-50 text-rose-900';
                    } else {
                      style = 'border-slate-200 bg-slate-50 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${style}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Correct
                        </span>
                      )}
                      {isAnswered && isPicked && !isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                          <XCircle className="h-4 w-4" /> Incorrect
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer !== null && (
                <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-slate-700">
                    {quizQuestions[qIndex].explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 whitespace-nowrap shrink-0"
                  >
                    <span>{qIndex + 1 >= quizQuestions.length ? 'Finish Quiz' : 'Next Question'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. AI STORY STUDIO (PREMIUM) */}
      {activeTab === 'stories' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">AI Contextual Story Builder</h2>
              </div>
              <span className="text-xs font-medium text-amber-700">
                {isPremium ? 'Premium Active' : 'Premium Only'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Select 2–8 vocabulary words and Gemini weaves them into a vivid short story. Click any highlighted word while reading for instant definitions and audio.
            </p>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Target Words ({selectedStoryWords.length}/8)</span>
                <button
                  type="button"
                  onClick={() => {
                    const pick = [...VOCABULARY_LIBRARY]
                      .sort(() => Math.random() - 0.5)
                      .slice(0, 5)
                      .map((w) => w.word);
                    setSelectedStoryWords(pick);
                  }}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Pick 5 random
                </button>
              </div>
              <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                {VOCABULARY_LIBRARY.slice(0, 28).map((w) => {
                  const selected = selectedStoryWords.includes(w.word);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleStoryWord(w.word)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {w.word}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="story-genre" className="block text-xs font-semibold text-slate-700">
                  Genre
                </label>
                <select
                  id="story-genre"
                  value={storyGenre}
                  onChange={(e) => setStoryGenre(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                >
                  {STORY_GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="story-level" className="block text-xs font-semibold text-slate-700">
                  CEFR Level
                </label>
                <select
                  id="story-level"
                  value={storyLevel}
                  onChange={(e) => setStoryLevel(e.target.value as CEFRLevel)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
                >
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                  <option value="C2">C2 Proficiency</option>
                </select>
              </div>
            </div>

            {storyError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {storyError}
              </div>
            )}

            {isPremium ? (
              <button
                type="button"
                disabled={storyLoading || selectedStoryWords.length < 2}
                onClick={handleGenerateStory}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{storyLoading ? 'Crafting Story...' : 'Generate AI Story'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                <Crown className="h-4 w-4 text-amber-400" />
                <span>Unlock AI Stories · ₹49/mo</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 space-y-5">
            {generatedStory ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      {storyGenre} · CEFR {storyLevel} · Click highlighted words to inspect
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{generatedStory.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakEnglishText(generatedStory.story)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Read Aloud</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStory}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Save Story
                    </button>
                  </div>
                </div>

                {storySavedMsg && (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">{storySavedMsg}</p>
                )}

                <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-800 whitespace-pre-line">
                  {renderHighlightedStory(generatedStory.story, generatedStory.targetWords)}
                </div>

                {inspectedWord && (
                  <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg font-bold text-slate-900">
                          {inspectedWord.word}
                        </span>
                        <span className="font-mono-tabular text-xs text-slate-600">
                          {inspectedWord.phonetic}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectedWord(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                      >
                        Close
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{inspectedWord.definition}</p>
                  </div>
                )}

                {generatedStory.wordNotes.length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold text-slate-500">Contextual Usage Notes</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {generatedStory.wordNotes.map((note, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                          <span className="font-bold text-slate-900">{note.word}: </span>
                          <span className="text-slate-600">{note.usageNote}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-900">Saved Stories Archive</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {stories.length === 0
                    ? 'Stories you generate and save appear here for offline reading and review.'
                    : `${stories.length} saved stories synced to your account`}
                </p>
                {stories.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {stories.map((s, idx) => (
                      <div key={s.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-bold text-slate-900">{s.title}</span>
                          <span className="text-xs text-slate-500">
                            {s.genre} · {s.level}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-700 line-clamp-3">{s.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <BookOpen className="mx-auto h-7 w-7 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Select target words on the left to craft your first story
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ADVANCED REVISION & LEARNING ANALYTICS (PREMIUM) */}
      {activeTab === 'revision' && (
        <div className="space-y-6">
          {!isPremium && (
            <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Advanced Spaced Revision &amp; Retention Analytics
                </h2>
                <p className="mt-1 text-sm text-slate-700">
                  Unlock the SM-2 overdue review queue, CEFR mastery breakdown, and Mistake Clinic with VocabFlow Premium (₹49/month).
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Crown className="h-4 w-4 text-amber-400" />
                <span>Upgrade · ₹49/mo</span>
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            {/* CEFR Mastery Analytics */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
              <h3 className="text-lg font-bold text-slate-900">Mastery by CEFR Tier</h3>
              <p className="mt-1 text-xs text-slate-500">Your proficiency distribution across B1–C2 vocabulary</p>
              <div className="mt-5 space-y-4">
                {cefrBreakdown.map((row) => (
                  <div key={row.lvl}>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700">Level {row.lvl}</span>
                      <span className="font-mono-tabular text-slate-900">
                        {row.mastered}/{row.total} ({row.pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Spaced Repetition Queue */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Spaced Revision Queue</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {overdueWords.length} words flagged for immediate reinforcement
                  </p>
                </div>
                {isPremium && overdueWords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeckScope('due');
                      onTabChange('flashcards');
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Drill Queue
                  </button>
                )}
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {overdueWords.length === 0 ? (
                  <p className="py-6 text-sm text-slate-500">
                    No overdue words right now. Practice flashcards or quizzes to populate your spaced repetition schedule.
                  </p>
                ) : (
                  overdueWords.slice(0, 6).map((w) => {
                    const p = wordProgress[w.id];
                    return (
                      <div key={w.id} className="flex items-center justify-between py-3">
                        <div>
                          <span className="font-display text-sm font-bold text-slate-900">{w.word}</span>
                          <span className="ml-2 text-xs text-slate-500">{w.simpleMeaning}</span>
                        </div>
                        <span className="font-mono-tabular text-xs text-rose-700">
                          {p?.mistakeCount ?? 0} misses
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Recent Quiz History Table */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Quiz Performance</h3>
            {quizAttempts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Complete a quiz to track accuracy trends over time.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2.5 font-semibold">Mode</th>
                      <th className="pb-2.5 font-semibold text-right">Score</th>
                      <th className="pb-2.5 font-semibold text-right">Accuracy</th>
                      <th className="pb-2.5 font-semibold text-right">XP Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quizAttempts.slice(0, 8).map((q, idx) => (
                      <tr key={q.id || idx} className="h-10">
                        <td className="font-medium capitalize text-slate-800">
                          {q.mode.replace('_', ' ')}
                        </td>
                        <td className="text-right font-mono-tabular text-slate-700">
                          {q.score}/{q.total}
                        </td>
                        <td className="text-right font-mono-tabular font-semibold text-slate-900">
                          {q.accuracy}%
                        </td>
                        <td className="text-right font-mono-tabular text-emerald-700">+{q.xpEarned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
