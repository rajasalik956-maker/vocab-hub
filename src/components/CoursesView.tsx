import { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Crown, Lock, Volume2 } from 'lucide-react';
import {
  EXCLUSIVE_COURSES,
  speakEnglishText,
  VOCABULARY_LIBRARY,
  type ExclusiveCourse,
} from '../data/vocabulary';
import type { AppView, CourseProgress } from '../types/vocabflow';

interface CoursesViewProps {
  courseProgress: Record<string, CourseProgress>;
  isPremium: boolean;
  onToggleModule: (courseId: string, moduleId: string) => Promise<void>;
  onNavigate: (view: AppView) => void;
}

export function CoursesView({
  courseProgress,
  isPremium,
  onToggleModule,
  onNavigate,
}: CoursesViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<ExclusiveCourse>(EXCLUSIVE_COURSES[0]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const activeModule = selectedCourse.modules[selectedModuleIndex] || selectedCourse.modules[0];
  const completedList = courseProgress[selectedCourse.id]?.completedModules ?? [];
  const isModuleCompleted = completedList.includes(activeModule.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Structured Curriculum</span>
            <span aria-hidden="true">·</span>
            <span>{isPremium ? 'Full Access Unlocked' : 'Premium Feature'}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Exclusive Vocabulary Courses</h1>
          <p className="mt-1 text-sm text-slate-600">
            Scenario-driven modules crafted for executive meetings, academic writing, and expressive prose.
          </p>
        </div>

        {!isPremium && (
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Crown className="h-4 w-4 text-amber-400" />
            <span>Unlock All Courses · ₹49/mo</span>
          </button>
        )}
      </div>

      {/* Course Selector Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {EXCLUSIVE_COURSES.map((course) => {
          const done = courseProgress[course.id]?.completedModules?.length ?? 0;
          const total = course.modules.length;
          const isSelected = selectedCourse.id === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                setSelectedCourse(course);
                setSelectedModuleIndex(0);
              }}
              className={`flex flex-col overflow-hidden rounded-2xl border text-left transition-colors ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {!failedImages[course.id] ? (
                  <img
                    src={course.image}
                    alt={course.title}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, [course.id]: true }))}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 text-xs text-slate-500">
                    {course.title}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>CEFR {course.level}</span>
                    <span className="font-mono-tabular">
                      {done}/{total} modules
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold text-slate-900">{course.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{course.subtitle}</p>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${Math.round((done / total) * 100)}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Course Lesson Workspace */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-4 space-y-3">
          <h3 className="text-base font-bold text-slate-900">Course Modules</h3>
          <div className="space-y-2">
            {selectedCourse.modules.map((mod, idx) => {
              const modDone = completedList.includes(mod.id);
              const isCurrent = idx === selectedModuleIndex;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setSelectedModuleIndex(idx)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{mod.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>{mod.durationMinutes} min</span>
                      <span>·</span>
                      <span>{mod.wordIds.length} key words</span>
                    </div>
                  </div>
                  {modDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : !isPremium && idx > 0 ? (
                    <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-8">
          {!isPremium && selectedModuleIndex > 0 ? (
            <div className="py-10 text-center">
              <Crown className="mx-auto h-8 w-8 text-amber-600" />
              <h3 className="mt-3 text-xl font-bold text-slate-900">Premium Course Module</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Module 1 of every course is available as a free preview. Upgrade to VocabFlow Premium (₹49/month) to unlock all remaining modules and certificate tracking.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('account')}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <span>Upgrade to Premium · ₹49/mo</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {selectedCourse.title} · {activeModule.durationMinutes} min lesson
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{activeModule.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{activeModule.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleModule(selectedCourse.id, activeModule.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isModuleCompleted
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isModuleCompleted ? 'Completed' : 'Mark Module Complete'}</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-indigo-700">Core Lesson Principle</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                    {activeModule.lessonTakeaway}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-emerald-50/60 p-4">
                  <p className="text-xs font-semibold text-emerald-800">Usage Upgrade Practice</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                    {activeModule.dialoguePrompt}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <span>Module Vocabulary Focus</span>
                </h4>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {activeModule.wordIds.map((id) => {
                    const word = VOCABULARY_LIBRARY.find((w) => w.id === id);
                    if (!word) return null;
                    return (
                      <div key={id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-display text-base font-bold text-slate-900">
                              {word.word}
                            </span>
                            <span className="ml-2 font-mono-tabular text-xs text-slate-400">
                              {word.phonetic}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakEnglishText(`${word.word}. ${word.examples[0]}`)}
                            className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-indigo-600"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{word.simpleMeaning}</p>
                        <p className="mt-2 text-[11px] italic text-slate-500">
                          &ldquo;{word.examples[0]}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
