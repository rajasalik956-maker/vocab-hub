import { ArrowUpRight, BookOpen } from 'lucide-react';

interface AdBannerProps {
  slot: 'dashboard' | 'library';
  onUpgradeClick: () => void;
}

/**
 * Carefully placed non-intrusive sponsor placement for Free tier users.
 * Never rendered during active flashcards, quizzes, AI stories, or revision sessions.
 */
export function AdBanner({ slot, onUpgradeClick }: AdBannerProps) {
  const copy =
    slot === 'dashboard'
      ? {
          partner: 'Oxford Learner Editions',
          headline: 'Classic Annotated Dictionaries & Style Guides',
          detail: 'Print and digital desk companions curated for everyday English precision.',
        }
      : {
          partner: 'Paperback & Prose Book Club',
          headline: 'Monthly Essays & Contemporary Non-Fiction',
          detail: 'Build reading fluency with curated long-form essays and reading notes.',
        };

  return (
    <aside
      aria-label="Sponsored recommendation"
      className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Sponsored</span>
              <span aria-hidden="true">·</span>
              <span>{copy.partner}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{copy.headline}</p>
            <p className="mt-0.5 text-xs text-slate-600">{copy.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <span>Remove ads (₹49/mo)</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
