import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getTodayKey, type CEFRLevel } from '../data/vocabulary';
import {
  FREE_COLLECTION_LIMIT,
  type AiStory,
  type CourseProgress,
  type DailyActivity,
  type PaymentReceipt,
  type QuizAttempt,
  type SubscriptionState,
  type UserProfile,
  type VocabCollection,
  type WordProgress,
} from '../types/vocabflow';

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  uid: '',
  email: '',
  tier: 'free',
  status: 'inactive',
  provider: 'none',
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  lastOrderId: null,
  lastPaymentId: null,
  updatedAt: '',
};

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'item';
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayKey(d);
}

export function useVocabFlowData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wordProgress, setWordProgress] = useState<Record<string, WordProgress>>({});
  const [collections, setCollections] = useState<VocabCollection[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [stories, setStories] = useState<AiStory[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [dailyActivity, setDailyActivity] = useState<Record<string, DailyActivity>>({});
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT_SUBSCRIPTION);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const isPremium = subscription.tier === 'premium';

  const getIdToken = useCallback(async (): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('Please sign in first.');
    }
    return auth.currentUser.getIdToken();
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!auth.currentUser) {
      setSubscription(DEFAULT_SUBSCRIPTION);
      setReceipts([]);
      return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const resp = await fetch('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          subscription: SubscriptionState;
          receipts: PaymentReceipt[];
        };
        setSubscription(data.subscription);
        setReceipts(data.receipts || []);
      }
    } catch {
      // Keep current subscription state on transient network error
    }
  }, []);

  // Auth listener & initial profile provisioning
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        setProfile(null);
        setWordProgress({});
        setCollections([]);
        setQuizAttempts([]);
        setStories([]);
        setCourseProgress({});
        setDailyActivity({});
        setSubscription(DEFAULT_SUBSCRIPTION);
        setReceipts([]);
        return;
      }

      setDataLoading(true);
      const userPath = `users/${firebaseUser.uid}`;
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const today = getTodayKey();

        if (!snap.exists()) {
          const cleanName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner')
            .trim()
            .slice(0, 80);
          const initialProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: cleanName || 'Learner',
            email: (firebaseUser.email || '').slice(0, 160),
            targetLevel: 'B2',
            dailyGoal: 10,
            region: 'IN',
            streak: 1,
            longestStreak: 1,
            lastActiveDate: today,
            xp: 0,
            wordsLearnedToday: 0,
            dailyStatsDate: today,
            flashcardsUsedToday: 0,
            quizzesUsedToday: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialProfile);
        } else {
          const data = snap.data() as UserProfile;
          if (data.dailyStatsDate !== today) {
            const yesterday = getYesterdayKey();
            const keptStreak =
              data.lastActiveDate === today || data.lastActiveDate === yesterday
                ? data.streak
                : 0;
            await updateDoc(userRef, {
              dailyStatsDate: today,
              wordsLearnedToday: 0,
              flashcardsUsedToday: 0,
              quizzesUsedToday: 0,
              streak: keptStreak,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      } finally {
        setDataLoading(false);
      }

      void refreshSubscription();
    });
    return () => unsub();
  }, [refreshSubscription]);

  // Firestore real-time listeners (strictly gated on authReady && user)
  useEffect(() => {
    if (!authReady || !user) return;
    const uid = user.uid;

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const wpQuery = query(collection(db, `users/${uid}/wordProgress`), where('uid', '==', uid));
    const unsubWp = onSnapshot(
      wpQuery,
      (snap) => {
        const next: Record<string, WordProgress> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as WordProgress;
        });
        setWordProgress(next);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/wordProgress`)
    );

    const colQuery = query(collection(db, `users/${uid}/collections`), where('uid', '==', uid));
    const unsubCols = onSnapshot(
      colQuery,
      (snap) => {
        const list: VocabCollection[] = [];
        snap.forEach((d) => list.push(d.data() as VocabCollection));
        setCollections(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/collections`)
    );

    const quizQuery = query(
      collection(db, `users/${uid}/quizAttempts`),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const unsubQuizzes = onSnapshot(
      quizQuery,
      (snap) => {
        const list: QuizAttempt[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as QuizAttempt) }));
        setQuizAttempts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/quizAttempts`)
    );

    const storyQuery = query(
      collection(db, `users/${uid}/stories`),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubStories = onSnapshot(
      storyQuery,
      (snap) => {
        const list: AiStory[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as AiStory) }));
        setStories(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/stories`)
    );

    const courseQuery = query(collection(db, `users/${uid}/courseProgress`), where('uid', '==', uid));
    const unsubCourses = onSnapshot(
      courseQuery,
      (snap) => {
        const next: Record<string, CourseProgress> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as CourseProgress;
        });
        setCourseProgress(next);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/courseProgress`)
    );

    const activityQuery = query(collection(db, `users/${uid}/dailyActivity`), where('uid', '==', uid));
    const unsubActivity = onSnapshot(
      activityQuery,
      (snap) => {
        const next: Record<string, DailyActivity> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as DailyActivity;
        });
        setDailyActivity(next);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/dailyActivity`)
    );

    return () => {
      unsubProfile();
      unsubWp();
      unsubCols();
      unsubQuizzes();
      unsubStories();
      unsubCourses();
      unsubActivity();
    };
  }, [authReady, user]);

  // Helper: bump daily activity & profile streak/xp
  const bumpActivity = useCallback(
    async (opts: { wordsDelta?: number; quizzesDelta?: number; flashcardsDelta?: number; xpDelta?: number }) => {
      if (!user || !profile) return;
      const uid = user.uid;
      const today = getTodayKey();
      const yesterday = getYesterdayKey();

      const wordsDelta = opts.wordsDelta ?? 0;
      const quizzesDelta = opts.quizzesDelta ?? 0;
      const flashcardsDelta = opts.flashcardsDelta ?? 0;
      const xpDelta = opts.xpDelta ?? 0;

      const isSameDay = profile.dailyStatsDate === today;
      const nextWordsToday = (isSameDay ? profile.wordsLearnedToday : 0) + wordsDelta;
      const nextFlashcardsToday = (isSameDay ? profile.flashcardsUsedToday : 0) + flashcardsDelta;
      const nextQuizzesToday = (isSameDay ? profile.quizzesUsedToday : 0) + quizzesDelta;

      let nextStreak = profile.streak;
      if (profile.lastActiveDate !== today) {
        nextStreak = profile.lastActiveDate === yesterday ? profile.streak + 1 : 1;
      } else if (nextStreak === 0) {
        nextStreak = 1;
      }

      const profilePath = `users/${uid}`;
      try {
        await updateDoc(doc(db, 'users', uid), {
          dailyStatsDate: today,
          lastActiveDate: today,
          streak: nextStreak,
          longestStreak: Math.max(profile.longestStreak, nextStreak),
          xp: profile.xp + xpDelta,
          wordsLearnedToday: nextWordsToday,
          flashcardsUsedToday: nextFlashcardsToday,
          quizzesUsedToday: nextQuizzesToday,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, profilePath);
      }

      const actPath = `users/${uid}/dailyActivity/${today}`;
      const existingAct = dailyActivity[today];
      try {
        if (!existingAct) {
          await setDoc(doc(db, 'users', uid, 'dailyActivity', today), {
            uid,
            dateKey: today,
            wordsReviewed: wordsDelta,
            quizzesCompleted: quizzesDelta,
            xpEarned: xpDelta,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'users', uid, 'dailyActivity', today), {
            wordsReviewed: existingAct.wordsReviewed + wordsDelta,
            quizzesCompleted: existingAct.quizzesCompleted + quizzesDelta,
            xpEarned: existingAct.xpEarned + xpDelta,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, actPath);
      }
    },
    [dailyActivity, profile, user]
  );

  // Record flashcard / SM-2 review (quality: 1=Again, 2=Hard, 3=Good, 4=Easy)
  const recordWordReview = useCallback(
    async (wordId: string, quality: 1 | 2 | 3 | 4, countsTowardFlashcardQuota = true) => {
      if (!user) return;
      const uid = user.uid;
      const cleanWordId = sanitizeId(wordId);
      const prev = wordProgress[cleanWordId];
      const now = new Date();

      let repetitions = prev?.repetitions ?? 0;
      let easeFactor = prev?.easeFactor ?? 2.5;
      let intervalDays = prev?.intervalDays ?? 0;
      let correctCount = prev?.correctCount ?? 0;
      let mistakeCount = prev?.mistakeCount ?? 0;

      if (quality === 1) {
        repetitions = 0;
        intervalDays = 1;
        mistakeCount += 1;
        easeFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
      } else {
        correctCount += 1;
        if (repetitions === 0) intervalDays = 1;
        else if (repetitions === 1) intervalDays = 3;
        else intervalDays = Math.min(365, Math.round(intervalDays * easeFactor));
        repetitions += 1;
        if (quality === 2) easeFactor = Math.max(1.3, Number((easeFactor - 0.1).toFixed(2)));
        if (quality === 4) {
          easeFactor = Math.min(4.5, Number((easeFactor + 0.15).toFixed(2)));
          intervalDays = Math.min(365, Math.max(intervalDays + 2, Math.round(intervalDays * 1.3)));
        }
      }

      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      const status: WordProgress['status'] =
        quality === 1
          ? 'needs_review'
          : repetitions >= 2 && intervalDays >= 3
          ? 'mastered'
          : 'learning';

      const wpPath = `users/${uid}/wordProgress/${cleanWordId}`;
      const wpRef = doc(db, 'users', uid, 'wordProgress', cleanWordId);

      try {
        if (!prev) {
          await setDoc(wpRef, {
            uid,
            wordId: cleanWordId,
            status,
            easeFactor,
            intervalDays,
            repetitions,
            correctCount,
            mistakeCount,
            nextReviewAt: nextReview.toISOString(),
            lastReviewedAt: now.toISOString(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(wpRef, {
            status,
            easeFactor,
            intervalDays,
            repetitions,
            correctCount,
            mistakeCount,
            nextReviewAt: nextReview.toISOString(),
            lastReviewedAt: now.toISOString(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, wpPath);
      }

      await bumpActivity({
        wordsDelta: 1,
        flashcardsDelta: countsTowardFlashcardQuota ? 1 : 0,
        xpDelta: quality === 1 ? 5 : quality === 4 ? 15 : 10,
      });
    },
    [bumpActivity, user, wordProgress]
  );

  // Toggle mastered directly from Library / Word of the Day
  const toggleWordMastered = useCallback(
    async (wordId: string) => {
      if (!user) return;
      const uid = user.uid;
      const cleanWordId = sanitizeId(wordId);
      const prev = wordProgress[cleanWordId];
      const nextStatus: WordProgress['status'] = prev?.status === 'mastered' ? 'learning' : 'mastered';
      const now = new Date();
      const wpRef = doc(db, 'users', uid, 'wordProgress', cleanWordId);
      const wpPath = `users/${uid}/wordProgress/${cleanWordId}`;

      try {
        if (!prev) {
          await setDoc(wpRef, {
            uid,
            wordId: cleanWordId,
            status: nextStatus,
            easeFactor: 2.5,
            intervalDays: nextStatus === 'mastered' ? 7 : 1,
            repetitions: nextStatus === 'mastered' ? 2 : 1,
            correctCount: 1,
            mistakeCount: 0,
            nextReviewAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
            lastReviewedAt: now.toISOString(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(wpRef, {
            status: nextStatus,
            intervalDays: nextStatus === 'mastered' ? Math.max(7, prev.intervalDays) : 1,
            lastReviewedAt: now.toISOString(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, wpPath);
      }

      if (nextStatus === 'mastered') {
        await bumpActivity({ wordsDelta: 1, xpDelta: 15 });
      }
    },
    [bumpActivity, user, wordProgress]
  );

  // Save completed quiz
  const saveQuizAttempt = useCallback(
    async (attempt: Omit<QuizAttempt, 'uid' | 'createdAt' | 'id'>) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}/quizAttempts`;
      try {
        await addDoc(collection(db, path), {
          uid,
          mode: attempt.mode,
          score: attempt.score,
          total: attempt.total,
          accuracy: attempt.accuracy,
          xpEarned: attempt.xpEarned,
          missedWordIds: attempt.missedWordIds.slice(0, 25),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      // Mark missed words as needs_review
      for (const wId of attempt.missedWordIds.slice(0, 10)) {
        const cleanId = sanitizeId(wId);
        const prev = wordProgress[cleanId];
        const wpRef = doc(db, 'users', uid, 'wordProgress', cleanId);
        const now = new Date();
        try {
          if (!prev) {
            await setDoc(wpRef, {
              uid,
              wordId: cleanId,
              status: 'needs_review',
              easeFactor: 2.3,
              intervalDays: 0,
              repetitions: 0,
              correctCount: 0,
              mistakeCount: 1,
              nextReviewAt: now.toISOString(),
              lastReviewedAt: now.toISOString(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(wpRef, {
              status: 'needs_review',
              mistakeCount: prev.mistakeCount + 1,
              nextReviewAt: now.toISOString(),
              lastReviewedAt: now.toISOString(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}/wordProgress/${cleanId}`);
        }
      }

      await bumpActivity({
        wordsDelta: attempt.score,
        quizzesDelta: 1,
        xpDelta: attempt.xpEarned,
      });
    },
    [bumpActivity, user, wordProgress]
  );

  // Custom collections CRUD
  const createCollection = useCallback(
    async (name: string, description: string, color: VocabCollection['color']) => {
      if (!user) return;
      if (!isPremium && collections.length >= FREE_COLLECTION_LIMIT) {
        throw new Error('Free plan supports up to 2 custom collections. Upgrade to Premium for unlimited collections.');
      }
      const uid = user.uid;
      const collectionId = `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const path = `users/${uid}/collections/${collectionId}`;
      try {
        await setDoc(doc(db, 'users', uid, 'collections', collectionId), {
          uid,
          collectionId,
          name: name.trim().slice(0, 60) || 'Vocabulary List',
          description: description.trim().slice(0, 200),
          color,
          wordIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [collections.length, isPremium, user]
  );

  const toggleWordInCollection = useCallback(
    async (collectionId: string, wordId: string) => {
      if (!user) return;
      const col = collections.find((c) => c.collectionId === collectionId);
      if (!col) return;
      const cleanWordId = sanitizeId(wordId);
      const exists = col.wordIds.includes(cleanWordId);
      const nextWordIds = exists
        ? col.wordIds.filter((id) => id !== cleanWordId)
        : [...col.wordIds, cleanWordId].slice(0, 200);
      const path = `users/${user.uid}/collections/${collectionId}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'collections', collectionId), {
          wordIds: nextWordIds,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [collections, user]
  );

  const deleteCollection = useCallback(
    async (collectionId: string) => {
      if (!user) return;
      const path = `users/${user.uid}/collections/${collectionId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'collections', collectionId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  // Save AI story
  const saveAiStory = useCallback(
    async (story: Omit<AiStory, 'uid' | 'createdAt' | 'id'>) => {
      if (!user) return;
      const path = `users/${user.uid}/stories`;
      try {
        await addDoc(collection(db, path), {
          uid: user.uid,
          title: story.title.slice(0, 140),
          genre: story.genre.slice(0, 40),
          level: story.level,
          content: story.content.slice(0, 8000),
          targetWords: story.targetWords.slice(0, 12),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  // Complete a course module
  const toggleCourseModule = useCallback(
    async (courseId: string, moduleId: string) => {
      if (!user) return;
      const uid = user.uid;
      const cleanCourse = sanitizeId(courseId);
      const existing = courseProgress[cleanCourse];
      const currentList = existing?.completedModules ?? [];
      const nextList = currentList.includes(moduleId)
        ? currentList.filter((m) => m !== moduleId)
        : [...currentList, moduleId].slice(0, 20);
      const path = `users/${uid}/courseProgress/${cleanCourse}`;
      try {
        if (!existing) {
          await setDoc(doc(db, 'users', uid, 'courseProgress', cleanCourse), {
            uid,
            courseId: cleanCourse,
            completedModules: nextList,
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'users', uid, 'courseProgress', cleanCourse), {
            completedModules: nextList,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      if (!currentList.includes(moduleId)) {
        await bumpActivity({ xpDelta: 25 });
      }
    },
    [bumpActivity, courseProgress, user]
  );

  // Update profile preferences
  const updateProfileSettings = useCallback(
    async (updates: { displayName: string; targetLevel: CEFRLevel; dailyGoal: number; region: 'IN' | 'INTL' }) => {
      if (!user) return;
      const uid = user.uid;
      const path = `users/${uid}`;
      try {
        await updateDoc(doc(db, 'users', uid), {
          displayName: updates.displayName.trim().slice(0, 80) || 'Learner',
          targetLevel: updates.targetLevel,
          dailyGoal: Math.min(50, Math.max(5, Math.round(updates.dailyGoal))),
          region: updates.region,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  return {
    user,
    authReady,
    dataLoading,
    profile,
    wordProgress,
    collections,
    quizAttempts,
    stories,
    courseProgress,
    dailyActivity,
    subscription,
    receipts,
    isPremium,
    getIdToken,
    refreshSubscription,
    recordWordReview,
    toggleWordMastered,
    saveQuizAttempt,
    createCollection,
    toggleWordInCollection,
    deleteCollection,
    saveAiStory,
    toggleCourseModule,
    updateProfileSettings,
  };
}
