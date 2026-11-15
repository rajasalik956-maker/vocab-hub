import { useEffect, useState } from 'react';
import { Crown, LayoutDashboard, BookOpen, GraduationCap, Layers, User } from 'lucide-react';
import { useVocabFlowData } from './hooks/useVocabFlowData';
import type { AppView, LearnTab } from './types/vocabflow';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { LearnStudio } from './components/LearnStudio';
import { LibraryView } from './components/LibraryView';
import { CoursesView } from './components/CoursesView';
import { AccountBillingView } from './components/AccountBillingView';

export default function App() {
  const {
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
  } = useVocabFlowData();

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [learnTab, setLearnTab] = useState<LearnTab>('flashcards');
  const [guestPreviewMode, setGuestPreviewMode] = useState(false);
  const [stripeVerifyBanner, setStripeVerifyBanner] = useState('');

  const navigate = (view: AppView, nextLearnTab?: LearnTab) => {
    setActiveView(view);
    if (nextLearnTab) setLearnTab(nextLearnTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Stripe Checkout return URL strictly via server-side verification
  useEffect(() => {
    if (!authReady || !user) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('stripe_session_id');
    const cancelled = params.get('stripe_cancelled');
    if (!sessionId && !cancelled) return;

    window.history.replaceState({}, '', window.location.pathname);

    if (cancelled) {
      setActiveView('account');
      setStripeVerifyBanner('Stripe checkout was cancelled. Your plan remains unchanged.');
      return;
    }

    if (sessionId) {
      setActiveView('account');
      getIdToken()
        .then((token) =>
          fetch('/api/payments/stripe/verify-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          })
        )
        .then(async (resp) => {
          const data = await resp.json();
          if (!resp.ok) {
            throw new Error(data.error || 'Could not verify Stripe checkout session');
          }
          setStripeVerifyBanner('Stripe payment verified on server. VocabFlow Premium is now active.');
          await refreshSubscription();
        })
        .catch((err) => {
          setStripeVerifyBanner(
            err instanceof Error ? err.message : 'Stripe verification rejected: payment incomplete.'
          );
        });
    }
  }, [authReady, getIdToken, refreshSubscription, user]);

  // Loading shell while Firebase Auth initializes
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-slate-900">VocabFlow</p>
          <p className="mt-1 text-xs text-slate-500">Loading your study studio...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view (with optional Free Library preview)
  if (!user && !guestPreviewMode) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6">
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              VocabFlow
            </span>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setGuestPreviewMode(true);
                  setActiveView('library');
                }}
                className="hover:text-slate-900 whitespace-nowrap shrink-0"
              >
                Free Library
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuestPreviewMode(true);
                  setActiveView('dashboard');
                }}
                className="hover:text-slate-900 whitespace-nowrap shrink-0"
              >
                Word of the Day
              </button>
            </nav>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setGuestPreviewMode(true)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                Browse Free Preview
              </button>
            </div>
          </div>
        </header>
        <AuthView onExploreGuest={() => setGuestPreviewMode(true)} />
      </div>
    );
  }

  const navItems: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'learn', label: 'Learn', icon: Layers },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            VocabFlow
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (guestPreviewMode && !user && (item.id === 'learn' || item.id === 'courses' || item.id === 'account')) {
                      setGuestPreviewMode(false);
                      return;
                    }
                    navigate(item.id);
                  }}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'font-semibold text-indigo-600 underline decoration-indigo-600 decoration-2 underline-offset-8'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            {guestPreviewMode && !user ? (
              <button
                type="button"
                onClick={() => setGuestPreviewMode(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            ) : isPremium ? (
              <button
                type="button"
                onClick={() => navigate('account')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Premium</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('account')}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Go Premium · ₹49
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {stripeVerifyBanner && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-900">
            <span>{stripeVerifyBanner}</span>
            <button
              type="button"
              onClick={() => setStripeVerifyBanner('')}
              className="font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {dataLoading && !profile && user ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Syncing your cross-device progress...
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                profile={profile}
                wordProgress={wordProgress}
                quizAttempts={quizAttempts}
                dailyActivity={dailyActivity}
                isPremium={isPremium}
                isGuestPreview={guestPreviewMode && !user}
                getIdToken={getIdToken}
                onToggleMastered={toggleWordMastered}
                onNavigate={navigate}
                onPromptSignIn={() => setGuestPreviewMode(false)}
              />
            )}

            {activeView === 'learn' && user && (
              <LearnStudio
                activeTab={learnTab}
                onTabChange={setLearnTab}
                profile={profile}
                wordProgress={wordProgress}
                collections={collections}
                quizAttempts={quizAttempts}
                stories={stories}
                isPremium={isPremium}
                getIdToken={getIdToken}
                onRecordReview={recordWordReview}
                onSaveQuizAttempt={saveQuizAttempt}
                onSaveAiStory={saveAiStory}
                onNavigate={navigate}
              />
            )}

            {activeView === 'library' && (
              <LibraryView
                wordProgress={wordProgress}
                collections={collections}
                isPremium={isPremium}
                isGuestPreview={guestPreviewMode && !user}
                onToggleMastered={toggleWordMastered}
                onCreateCollection={createCollection}
                onToggleWordInCollection={toggleWordInCollection}
                onDeleteCollection={deleteCollection}
                onNavigate={navigate}
                onPromptSignIn={() => setGuestPreviewMode(false)}
              />
            )}

            {activeView === 'courses' && user && (
              <CoursesView
                courseProgress={courseProgress}
                isPremium={isPremium}
                onToggleModule={toggleCourseModule}
                onNavigate={navigate}
              />
            )}

            {activeView === 'account' && user && (
              <AccountBillingView
                profile={profile}
                subscription={subscription}
                receipts={receipts}
                isPremium={isPremium}
                getIdToken={getIdToken}
                onUpdateProfile={updateProfileSettings}
                onRefreshSubscription={refreshSubscription}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Thumb Navigation (<= 15% mobile viewport height) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (guestPreviewMode && !user && (item.id === 'learn' || item.id === 'courses' || item.id === 'account')) {
                  setGuestPreviewMode(false);
                  return;
                }
                navigate(item.id);
              }}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium ${
                active ? 'text-indigo-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
