import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { ArrowRight, Check, Lock, Mail, User as UserIcon, Volume2 } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { getWordOfTheDay, speakEnglishText } from '../data/vocabulary';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthViewProps {
  onExploreGuest?: () => void;
}

export function AuthView({ onExploreGuest }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [showProviderSetupHint, setShowProviderSetupHint] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const wod = getWordOfTheDay();

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      setShowProviderSetupHint(true);
      return 'Email/Password sign-in is not yet enabled in your Firebase Console. Use Google Sign-In below or enable Email/Password in Firebase Authentication.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please check your credentials or reset your password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account already exists with this email. Try signing in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Please choose a password with at least 6 characters.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setShowProviderSetupHint(false);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim().slice(0, 80) });
        }
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setInfoMsg('Password recovery email sent. Check your inbox to choose a new password.');
      }
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Editorial Hero & Live Word Preview */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <span>VocabFlow Learning Studio</span>
              <span aria-hidden="true">·</span>
              <span>CEFR B1 to C2</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
              Build lasting English fluency, one deliberate word at a time.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              Practice with spaced-repetition flashcards, adaptive quizzes, daily word goals, and Gemini-powered contextual stories synced seamlessly across every device.
            </p>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-video">
              {!imageFailed ? (
                <img
                  src="/src/assets/images/vocabflow_hero_study_1794762021761.jpg"
                  alt="Minimalist study desk with an open English dictionary and fountain pen"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-6 text-center">
                  <p className="text-sm font-medium text-slate-600">VocabFlow Editorial Study Environment</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Today&apos;s featured word</span>
                  <span aria-hidden="true">·</span>
                  <span>{wod.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{wod.partOfSpeech}</span>
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="font-display text-xl font-bold text-slate-900">{wod.word}</span>
                  <span className="font-mono-tabular text-xs text-slate-500">{wod.phonetic}</span>
                  <button
                    type="button"
                    onClick={() => speakEnglishText(wod.word)}
                    aria-label={`Pronounce ${wod.word}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-600">{wod.definition}</p>
              </div>
              {onExploreGuest && (
                <button
                  type="button"
                  onClick={onExploreGuest}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <span>Preview Free Library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Authentication Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'reset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recover
              </button>
            </div>

            <h2 className="mt-6 text-xl font-bold text-slate-900">
              {mode === 'login'
                ? 'Welcome back to VocabFlow'
                : mode === 'register'
                ? 'Start your free learning profile'
                : 'Recover your password'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'login'
                ? 'Sync your flashcards, daily streak, and custom word lists across devices.'
                : mode === 'register'
                ? 'Free forever for daily words, library access, flashcards, and quizzes.'
                : 'Enter your account email and we will send a password reset link.'}
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>or with email</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <div className="relative mt-1.5">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aarav Mehta"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <p className="font-semibold">Authentication notice</p>
                  <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                  {showProviderSetupHint && (
                    <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-rose-700">
                      <li>Open Firebase Console → Authentication → Sign-in method.</li>
                      <li>Enable the Email/Password provider and click Save.</li>
                    </ol>
                  )}
                </div>
              )}

              {infoMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {infoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                <span>
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                    ? 'Create Free Account'
                    : 'Send Recovery Email'}
                </span>
              </button>
            </form>
          </div>

          <ul className="mt-6 space-y-2 border-t border-slate-200 pt-5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Free tier includes daily vocabulary, flashcards, quizzes, and progress goals</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Optional Premium (₹49/mo) unlocks AI stories, courses, and unlimited practice</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
