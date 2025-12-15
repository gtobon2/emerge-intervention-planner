'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useHelpStore, tourSteps } from '@/stores/help';
import { Button } from '@/components/ui';

export function OnboardingTour() {
  const {
    isTourActive,
    currentTourStep,
    nextStep,
    prevStep,
    endTour,
    completeOnboarding,
  } = useHelpStore();

  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[currentTourStep];

  useEffect(() => {
    if (!isTourActive || !currentStep) return;

    const updateHighlight = () => {
      if (currentStep.target) {
        const element = document.querySelector(currentStep.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);

          // Calculate tooltip position based on step position
          const spacing = 20;
          let top = 0;
          let left = 0;

          switch (currentStep.position) {
            case 'right':
              top = rect.top + rect.height / 2;
              left = rect.right + spacing;
              break;
            case 'left':
              top = rect.top + rect.height / 2;
              left = rect.left - spacing;
              break;
            case 'bottom':
              top = rect.bottom + spacing;
              left = rect.left + rect.width / 2;
              break;
            case 'top':
            default:
              top = rect.top - spacing;
              left = rect.left + rect.width / 2;
              break;
          }

          setTooltipPosition({ top, left });
        } else {
          setHighlightRect(null);
        }
      } else {
        setHighlightRect(null);
        // Center the tooltip if no target
        setTooltipPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [isTourActive, currentTourStep, currentStep]);

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleNext = () => {
    if (currentTourStep === tourSteps.length - 1) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  if (!isTourActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay with cutout for highlighted element */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-auto"
        style={{
          background: highlightRect
            ? `
              linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))
            `
            : 'rgba(0, 0, 0, 0.7)',
        }}
      >
        {highlightRect && (
          <div
            className="absolute border-4 border-movement rounded-lg animate-pulse"
            style={{
              top: `${highlightRect.top - 4}px`,
              left: `${highlightRect.left - 4}px`,
              width: `${highlightRect.width + 8}px`,
              height: `${highlightRect.height + 8}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            }}
          />
        )}
      </div>

      {/* Tour tooltip */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: highlightRect
            ? `${tooltipPosition.top}px`
            : '50%',
          left: highlightRect
            ? `${tooltipPosition.left}px`
            : '50%',
          transform: highlightRect
            ? currentStep.position === 'right' || currentStep.position === 'left'
              ? 'translateY(-50%)'
              : 'translateX(-50%)'
            : 'translate(-50%, -50%)',
        }}
      >
        <div className="bg-surface rounded-lg shadow-2xl border border-text-muted/20 p-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary mb-1">
                {currentStep.title}
              </h3>
              <div className="flex items-center gap-1 mb-3">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentTourStep
                        ? 'w-8 bg-movement'
                        : index < currentTourStep
                        ? 'w-4 bg-movement/50'
                        : 'w-4 bg-text-muted/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 text-text-muted hover:text-text-primary transition-colors -mt-1 -mr-1"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-text-secondary mb-6">
            {currentStep.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-muted">
              Step {currentTourStep + 1} of {tourSteps.length}
            </div>
            <div className="flex items-center gap-2">
              {currentTourStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="gap-1"
              >
                {currentTourStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                {currentTourStep !== tourSteps.length - 1 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
