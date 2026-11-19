import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  GraduationCap,
  LogIn,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { HERO_BANNER_IMAGE } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

interface WelcomeViewProps {
  isSigningIn?: boolean;
  authError?: string | null;
  onContinueWithGoogle: (preferredRole?: 'student' | 'teacher') => void;
  onOpenSettings: () => void;
}

const PURPOSE_PILLARS = [
  {
    number: '01.',
    icon: BookOpen,
    title: 'Lesson Q&A & Study Ideas',
    description:
      'Ask focused questions on any class topic or share worked formulas, study notes, and exam checklists across Grades 7–12 and Faculty units.',
  },
  {
    number: '02.',
    icon: Mail,
    title: 'Question Mail & Stamp Check',
    description:
      'Every reply to your questions is delivered to your Question Mail inbox and marked with an animated dated Stamp Check when you read it.',
  },
  {
    number: '03.',
    icon: GraduationCap,
    title: 'Faculty Oversight & Clubs',
    description:
      'Connect with study friends, display your club crest (including ICT Club), attend campus events, and rely on faculty-approved teachers.',
  },
];

export function WelcomeView({
  isSigningIn = false,
  authError = null,
  onContinueWithGoogle,
  onOpenSettings,
}: WelcomeViewProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA]">
      <header className="sticky top-0 z-30 bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-b border-[#E2D9C6] dark:border-[#3D362D]">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-8">
          <span className="font-display text-lg sm:text-[26px] font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap truncate">
            StudyCommons
          </span>

          <span className="hidden md:inline text-xs text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
            Grades 7–12 Collaborative Study Hall & Q&A Archive
          </span>

          <div className="shrink-0 flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() => onContinueWithGoogle('student')}
              className="px-3 sm:px-4 min-h-[40px] sm:min-h-0 sm:py-2 text-xs font-medium text-[#443D34] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] disabled:opacity-60 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {isSigningIn ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings page"
              title="Settings"
              className="inline-flex items-center justify-center gap-1 w-10 h-10 rounded-lg sm:rounded-md border border-[#D8CEBA] dark:border-[#4A4137] bg-[#FFFDF8] dark:bg-[#1C1916] text-[#443D34] dark:text-[#E5DEC9] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] hover:border-[#C5B99F] dark:hover:border-[#635648] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12100E]"
            >
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14 space-y-8 sm:space-y-10">
        {authError && (
          <div
            role="alert"
            className="px-4 py-3 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-lg"
          >
            {authError}
          </div>
        )}

        {/* Hero Greeting Card */}
        <section className="heritage-card border rounded-xl sm:rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="heritage-eyebrow">
                Welcome to StudyCommons
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-[1.08] text-balance">
                Good day, scholar. Welcome to your school’s shared study commons.
              </h1>
              <p className="text-sm sm:text-base text-[#574F45] dark:text-[#D6CEC0] leading-relaxed max-w-2xl">
                StudyCommons connects students, peer tutors, and faculty across every department. Post lesson questions, share study ideas, collaborate with friends, and stay aligned with faculty-verified class updates in real time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={() => onContinueWithGoogle('student')}
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[46px] sm:min-h-[42px] text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] active:bg-[var(--theme-accent-active)] disabled:opacity-60 rounded-lg sm:rounded-md transition-colors sm:whitespace-nowrap text-center shrink-0"
                >
                  <LogIn className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isSigningIn ? 'Connecting Google...' : 'Continue with Google'}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={() => onContinueWithGoogle('teacher')}
                  className="inline-flex items-center justify-center gap-2 px-4 min-h-[46px] sm:min-h-[42px] text-sm font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] disabled:opacity-60 rounded-lg sm:rounded-md transition-colors sm:whitespace-nowrap text-center shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Apply for Teacher Account</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCheck
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>Grades 7–12 · Faculty-Approved Teachers · Question Mail Stamp Check</span>
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col border-t lg:border-t-0 lg:border-l border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#1E1A16]">
            <div className="flex-1 min-h-[200px] sm:min-h-[260px]">
              <ResilientImage
                src={HERO_BANNER_IMAGE}
                alt="Students studying together with open notebooks at a sunlit school library table"
                fallbackTitle="StudyCommons Reading Table"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-5 py-3.5 border-t border-[#E2D9C6] dark:border-[#3D362D] bg-[#F7F3EA] dark:bg-[#1A1714]">
              <p className="font-display italic text-sm text-[#443D34] dark:text-[#E0D8CA]">
                “A quiet place to ask honest questions, verify solutions together, and keep every term’s notes in order.”
              </p>
            </div>
          </div>
        </section>

        {/* Three-Column Overview: What StudyCommons Helps You Do */}
        <section aria-labelledby="app-purpose-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="heritage-eyebrow mb-1">Inside StudyCommons</p>
              <h2
                id="app-purpose-heading"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance"
              >
                Everything inside your school account
              </h2>
            </div>
            <span className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
              Real-time cloud sync · Verified faculty moderation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {PURPOSE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.number}
                  className="heritage-card border rounded-xl sm:rounded-lg p-5 sm:p-6 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#8C6D3B] dark:text-[#D4B475] tabular-nums">
                        {pillar.number}
                      </span>
                      <Icon
                        className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
