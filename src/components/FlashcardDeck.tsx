import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  LayoutList,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FlashcardItem } from '../utils/aiStudyResources.ts';
import { PolyvexMarkdown } from '../utils/markdownUtils.tsx';

interface FlashcardDeckProps {
  cards: FlashcardItem[];
  title?: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards: initialCards, title = 'Flashcard Study Deck' }) => {
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Sync cards when initialCards change
  useEffect(() => {
    setCards(initialCards);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
  }, [initialCards]);

  const currentCard = cards[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswerRevealed(false);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsAnswerRevealed(false);
    }
  }, [currentIndex]);

  const handleToggleAnswer = useCallback(() => {
    setIsAnswerRevealed((prev) => !prev);
  }, []);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
  };

  const handleRestart = () => {
    setCards(initialCards);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
  };

  // Keyboard navigation listener
  useEffect(() => {
    if (viewMode !== 'card') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleToggleAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleNext, handlePrev, handleToggleAnswer]);

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#101317] border border-[#262A30] rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262A30]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#090B0D] text-[#35F2D0] border border-[#262A30]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#F5F7FA]">{title}</h3>
            <span className="text-[11px] text-[#A1A8B3]">Active Recall Deck • {cards.length} cards</span>
          </div>
        </div>

        {/* View Mode Toggle & Deck Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0D] hover:bg-[#171A1E] border border-[#262A30] text-xs font-semibold text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
            title="Shuffle deck order"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#090B0D] hover:bg-[#171A1E] border border-[#262A30] text-xs font-semibold text-[#A1A8B3] hover:text-[#F5F7FA] transition cursor-pointer"
            title="Restart deck from Card 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <div className="flex items-center gap-1 bg-[#090B0D] p-1 rounded-xl border border-[#262A30]">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'card' ? 'bg-[#35F2D0] text-[#090B0D]' : 'text-[#A1A8B3] hover:text-[#F5F7FA]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Deck</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list' ? 'bg-[#35F2D0] text-[#090B0D]' : 'text-[#A1A8B3] hover:text-[#F5F7FA]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'card' && currentCard ? (
        <div className="space-y-4">
          {/* Main Flashcard Component */}
          <div
            tabIndex={0}
            role="button"
            aria-label={`Flashcard ${currentIndex + 1} of ${cards.length}. Press Space or Enter to reveal answer.`}
            onClick={handleToggleAnswer}
            className="relative min-h-[220px] sm:min-h-[260px] p-6 sm:p-8 rounded-2xl bg-[#171A1E] border border-[#35F2D0]/30 hover:border-[#35F2D0] transition-all duration-200 cursor-pointer shadow-md select-none flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#35F2D0]"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-[#262A30]/60">
              <span className="font-mono text-[#35F2D0] font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Card {currentIndex + 1} of {cards.length}</span>
              </span>
              <span className="text-[11px] text-[#A1A8B3] font-medium hidden sm:inline">
                Click or press Space to {isAnswerRevealed ? 'hide' : 'reveal'} answer
              </span>
            </div>

            {/* Content Display with KaTeX Math & Markdown */}
            <div className="my-auto py-4 space-y-3">
              {!isAnswerRevealed ? (
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded bg-[#090B0D] text-[#A1A8B3] border border-[#262A30] text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                    QUESTION
                  </span>
                  <div className="text-base sm:text-lg font-bold text-[#F5F7FA] leading-relaxed">
                    <PolyvexMarkdown text={currentCard.question} />
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn space-y-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#102427] text-[#35F2D0] border border-[#35F2D0]/30 text-[10px] font-mono uppercase font-bold tracking-wider mb-2">
                      ANSWER
                    </span>
                    <div className="text-base sm:text-lg font-semibold text-[#35F2D0] leading-relaxed">
                      <PolyvexMarkdown text={currentCard.answer} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-3 border-t border-[#262A30]/60 flex items-center justify-between text-xs text-[#A1A8B3]">
              <span>{isAnswerRevealed ? 'Answer Revealed' : 'Tap to reveal answer'}</span>
              <span className="font-mono text-[10px] text-[#64748B]">
                {currentIndex + 1}/{cards.length}
              </span>
            </div>
          </div>

          {/* Primary Controls Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#171A1E] border border-[#262A30] hover:border-[#35F2D0]/40 text-xs font-bold text-[#F5F7FA] hover:text-[#35F2D0] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Prominent Show / Hide Answer Button */}
            <button
              type="button"
              onClick={handleToggleAnswer}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                isAnswerRevealed
                  ? 'bg-[#171A1E] text-[#F5F7FA] border border-[#262A30] hover:bg-[#20252C]'
                  : 'bg-[#35F2D0] text-[#090B0D] hover:bg-[#35F2D0]/90 shadow-[0_0_12px_rgba(53,242,208,0.25)]'
              }`}
            >
              {isAnswerRevealed ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide Answer</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Show Answer</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={currentIndex === cards.length - 1}
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#171A1E] border border-[#262A30] hover:border-[#35F2D0]/40 text-xs font-bold text-[#F5F7FA] hover:text-[#35F2D0] disabled:opacity-40 transition cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* List View Mode */
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {cards.map((card, idx) => (
            <div key={card.id || idx} className="p-4 rounded-xl bg-[#171A1E] border border-[#262A30] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#35F2D0] uppercase">
                <span>Card {idx + 1} of {cards.length}</span>
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#F5F7FA]">
                <PolyvexMarkdown text={`**Q:** ${card.question}`} />
              </div>
              <div className="text-xs sm:text-sm text-[#35F2D0] pt-2 border-t border-[#262A30]/60 font-medium">
                <PolyvexMarkdown text={`**A:** ${card.answer}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
