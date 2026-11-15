import { useMemo, useState, type FormEvent } from 'react';
import {
  BookmarkCheck,
  Crown,
  FolderPlus,
  Plus,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  speakEnglishText,
  VOCABULARY_LIBRARY,
  type CEFRLevel,
  type VocabCategory,
  type VocabWord,
} from '../data/vocabulary';
import {
  FREE_COLLECTION_LIMIT,
  type AppView,
  type VocabCollection,
  type WordProgress,
} from '../types/vocabflow';
import { AdBanner } from './AdBanner';

interface LibraryViewProps {
  wordProgress: Record<string, WordProgress>;
  collections: VocabCollection[];
  isPremium: boolean;
  isGuestPreview?: boolean;
  onToggleMastered: (wordId: string) => Promise<void>;
  onCreateCollection: (name: string, description: string, color: VocabCollection['color']) => Promise<void>;
  onToggleWordInCollection: (collectionId: string, wordId: string) => Promise<void>;
  onDeleteCollection: (collectionId: string) => Promise<void>;
  onNavigate: (view: AppView) => void;
  onPromptSignIn?: () => void;
}

const CATEGORIES: ('All' | VocabCategory)[] = [
  'All',
  'Academic',
  'Business',
  'Literature',
  'Rhetoric',
  'Science & Tech',
  'Everyday Mastery',
];

const LEVELS: ('All' | CEFRLevel)[] = ['All', 'B1', 'B2', 'C1', 'C2'];

export function LibraryView({
  wordProgress,
  collections,
  isPremium,
  isGuestPreview,
  onToggleMastered,
  onCreateCollection,
  onToggleWordInCollection,
  onDeleteCollection,
  onNavigate,
  onPromptSignIn,
}: LibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | CEFRLevel>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | VocabCategory>('All');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [activeWord, setActiveWord] = useState<VocabWord>(VOCABULARY_LIBRARY[0]);

  const [showNewColForm, setShowNewColForm] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colColor, setColColor] = useState<VocabCollection['color']>('indigo');
  const [colError, setColError] = useState('');

  const filteredWords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const activeCol = collections.find((c) => c.collectionId === selectedCollectionId);

    return VOCABULARY_LIBRARY.filter((w) => {
      if (levelFilter !== 'All' && w.level !== levelFilter) return false;
      if (categoryFilter !== 'All' && w.category !== categoryFilter) return false;
      if (activeCol && !activeCol.wordIds.includes(w.id)) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        w.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [categoryFilter, collections, levelFilter, searchTerm, selectedCollectionId]);

  const handleCreateCol = async (e: FormEvent) => {
    e.preventDefault();
    setColError('');
    try {
      await onCreateCollection(colName, colDesc, colColor);
      setColName('');
      setColDesc('');
      setShowNewColForm(false);
    } catch (err) {
      setColError(err instanceof Error ? err.message : 'Unable to create collection');
    }
  };

  const atFreeCollectionCap = !isPremium && collections.length >= FREE_COLLECTION_LIMIT;

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vocabulary Library &amp; Collections</h1>
            <p className="text-xs text-slate-500">
              Explore {VOCABULARY_LIBRARY.length} words with IPA phonetics, collocations, examples, and custom lists
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search words, meanings, synonyms..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  levelFilter === lvl ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | VocabCategory)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {!isGuestPreview && (
            <select
              aria-label="Filter by custom collection"
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="all">All Lists</option>
              {collections.map((c) => (
                <option key={c.collectionId} value={c.collectionId}>
                  {c.name} ({c.wordIds.length})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Split: Word List + Inspector & Custom Collections */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Word List */}
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 lg:col-span-7">
          {filteredWords.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No vocabulary entries matched your current filter.
            </div>
          ) : (
            filteredWords.map((item) => {
              const isSelected = activeWord.id === item.id;
              const status = wordProgress[item.id]?.status;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveWord(item)}
                  className={`flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors ${
                    isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-base font-bold text-slate-900">{item.word}</span>
                      <span className="font-mono-tabular text-xs text-slate-400">{item.phonetic}</span>
                      <span className="text-xs text-slate-500">
                        · {item.level} · {item.partOfSpeech}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{item.simpleMeaning}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'mastered' && (
                      <span className="text-xs font-semibold text-emerald-700">Mastered</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglishText(item.word);
                      }}
                      aria-label={`Listen to ${item.word}`}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-white hover:text-indigo-600"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Inspector + Custom Collections */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Word Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  {activeWord.level} · {activeWord.category} · {activeWord.partOfSpeech}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{activeWord.word}</h2>
                <p className="font-mono-tabular text-xs text-slate-500">{activeWord.phonetic}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakEnglishText(`${activeWord.word}. ${activeWord.examples[0]}`)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                {!isGuestPreview && (
                  <button
                    type="button"
                    onClick={() => onToggleMastered(activeWord.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                      wordProgress[activeWord.id]?.status === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" />
                    <span>
                      {wordProgress[activeWord.id]?.status === 'mastered' ? 'Mastered' : 'Mark Mastered'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-800">{activeWord.definition}</p>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70">
              <p className="text-xs font-semibold text-slate-500">Examples</p>
              {activeWord.examples.map((ex, i) => (
                <p key={i} className="text-xs leading-relaxed text-slate-700">
                  &ldquo;{ex}&rdquo;
                </p>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Synonyms: </span>
                {activeWord.synonyms.join(', ')}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Collocations: </span>
                {activeWord.collocations.join(' · ')}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Memory Hook: </span>
                {activeWord.memoryHook}
              </p>
            </div>

            {!isGuestPreview && collections.length > 0 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-slate-700">Save to Collection</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {collections.map((col) => {
                    const inCol = col.wordIds.includes(activeWord.id);
                    return (
                      <button
                        key={col.collectionId}
                        type="button"
                        onClick={() => onToggleWordInCollection(col.collectionId, activeWord.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          inCol
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Plus className={`h-3 w-3 ${inCol ? 'rotate-45' : ''}`} />
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Custom Collections Manager */}
          {!isGuestPreview && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Custom Collections</h3>
                  <p className="text-xs text-slate-500">
                    {isPremium
                      ? `${collections.length} lists · Unlimited with Premium`
                      : `${collections.length}/${FREE_COLLECTION_LIMIT} free lists used`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (atFreeCollectionCap) {
                      onNavigate('account');
                    } else {
                      setShowNewColForm((s) => !s);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  {atFreeCollectionCap ? (
                    <>
                      <Crown className="h-3.5 w-3.5 text-amber-600" />
                      <span>Unlock Unlimited</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>New List</span>
                    </>
                  )}
                </button>
              </div>

              {showNewColForm && (
                <form onSubmit={handleCreateCol} className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={colName}
                    onChange={(e) => setColName(e.target.value)}
                    placeholder="Collection name (e.g. Executive Interviews)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    maxLength={200}
                    value={colDesc}
                    onChange={(e) => setColDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  />
                  <div className="flex items-center justify-between">
                    <select
                      value={colColor}
                      onChange={(e) => setColColor(e.target.value as VocabCollection['color'])}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      <option value="indigo">Indigo</option>
                      <option value="emerald">Emerald</option>
                      <option value="amber">Amber</option>
                      <option value="sky">Sky</option>
                      <option value="rose">Rose</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Create List
                    </button>
                  </div>
                  {colError && <p className="text-xs text-rose-700">{colError}</p>}
                </form>
              )}

              <div className="mt-4 space-y-2">
                {collections.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Create a custom collection to group words for upcoming exams, meetings, or essays.
                  </p>
                ) : (
                  collections.map((col) => (
                    <div
                      key={col.collectionId}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCollectionId((prev) =>
                            prev === col.collectionId ? 'all' : col.collectionId
                          )
                        }
                        className="text-left"
                      >
                        <p className="text-xs font-bold text-slate-900">{col.name}</p>
                        <p className="text-[11px] text-slate-500">{col.wordIds.length} words</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCollection(col.collectionId)}
                        aria-label={`Delete ${col.name}`}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Non-learning Ad placement for Free tier */}
      {!isPremium && (
        <AdBanner
          slot="library"
          onUpgradeClick={() => (isGuestPreview && onPromptSignIn ? onPromptSignIn() : onNavigate('account'))}
        />
      )}
    </div>
  );
}
