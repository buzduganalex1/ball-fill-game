import {
  ONBOARDING_LEVEL_COPY,
  isGuidedOnboardingLevel,
  type OnboardingContext,
} from '../../domains/onboarding/OnboardingRules';

export interface OnboardingViewContext extends OnboardingContext {
  currentScreen: string;
}

export interface OnboardingCoachDependencies {
  getContext(): OnboardingViewContext;
  onHudTourStart(): void;
  onHudTourFinish(skipped: boolean): void;
  onHudStepAdvance(): void;
}

export interface OnboardingCoach {
  isHudTourActive(): boolean;
  syncClasses(): void;
  showLevelGuide(): void;
  dismissLevelGuide(): void;
  resetVisuals(): void;
  startHudTour(): void;
}

interface HudStep {
  target(): HTMLElement;
  text: string;
  tap?: boolean;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Onboarding coach requires ${selector}`);
  return element;
}

export function createOnboardingCoach(dependencies: OnboardingCoachDependencies): OnboardingCoach {
  const elements = {
    gameScreen: requireElement<HTMLElement>('#gameScreen'),
    coach: requireElement<HTMLElement>('#tutorialCoach'),
    levelBadge: requireElement<HTMLElement>('#tutorialLevelBadge'),
    promptText: requireElement<HTMLElement>('#tutorialPromptText'),
    overlay: requireElement<HTMLElement>('#hudTutorialOverlay'),
    spotlight: requireElement<HTMLElement>('#hudTutorialSpotlight'),
    card: requireElement<HTMLElement>('#hudTutorialCard'),
    step: requireElement<HTMLElement>('#hudTutorialStep'),
    text: requireElement<HTMLElement>('#hudTutorialText'),
    next: requireElement<HTMLButtonElement>('#hudTutorialNext'),
    finger: requireElement<HTMLElement>('#hudTutorialFinger'),
    skip: requireElement<HTMLButtonElement>('#hudTutorialSkip'),
    collectionButton: requireElement<HTMLElement>('#hudCollectionButton'),
    timerCard: requireElement<HTMLElement>('#hudTimerCard'),
    storeButton: requireElement<HTMLElement>('#gameToStore'),
  };
  const shownGuideLevels = new Set<number>();
  const hudSteps: HudStep[] = [
    { target: () => elements.collectionButton, text: 'This shows how many balls you have.' },
    { target: () => elements.timerCard, text: 'Complete the level before time runs out.' },
    { target: () => elements.storeButton, text: 'Collect money to unlock new items.' },
    { target: () => elements.collectionButton, text: 'Tap here to view and change your ball.', tap: true },
    { target: () => elements.storeButton, text: 'Tap here to visit the store.', tap: true },
  ];
  let hudTourActive = false;
  let hudIndex = 0;
  let dismissTimer: ReturnType<typeof setTimeout> | undefined;

  function syncClasses(): void {
    const context = dependencies.getContext();
    elements.gameScreen.classList.toggle(
      'onboardingLevel1',
      isGuidedOnboardingLevel(context, 1) && context.currentLevel === 1,
    );
    elements.gameScreen.classList.toggle('tutorialHudTour', hudTourActive);
    elements.gameScreen.dataset.onboardingLevel = isGuidedOnboardingLevel(context)
      ? String(context.currentLevel)
      : '0';
  }

  function showLevelGuide(): void {
    const context = dependencies.getContext();
    if (
      context.currentScreen !== 'game'
      || !isGuidedOnboardingLevel(context)
      || shownGuideLevels.has(context.currentLevel)
    ) return;

    shownGuideLevels.add(context.currentLevel);
    if (dismissTimer !== undefined) clearTimeout(dismissTimer);
    const level = context.currentLevel as 1 | 2;
    elements.levelBadge.textContent = `LEVEL ${level} • QUICK TIP`;
    elements.promptText.textContent = ONBOARDING_LEVEL_COPY[level];
    elements.coach.dataset.level = String(level);
    elements.coach.classList.remove('dismissing');
    elements.coach.classList.add('show');
    elements.coach.setAttribute('aria-hidden', 'false');
  }

  function dismissLevelGuide(): void {
    if (!elements.coach.classList.contains('show')) return;
    elements.coach.classList.add('dismissing');
    if (dismissTimer !== undefined) clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      elements.coach.classList.remove('show', 'dismissing');
      elements.coach.setAttribute('aria-hidden', 'true');
    }, 180);
  }

  function resetVisuals(): void {
    if (dismissTimer !== undefined) clearTimeout(dismissTimer);
    dismissTimer = undefined;
    elements.coach.classList.remove('show', 'dismissing');
    elements.coach.setAttribute('aria-hidden', 'true');
    elements.coach.dataset.level = '0';
    elements.overlay.classList.remove('show');
    elements.overlay.setAttribute('aria-hidden', 'true');
    elements.finger.classList.remove('show');
    syncClasses();
  }

  function positionHudStep(): void {
    if (!hudTourActive) return;
    const item = hudSteps[hudIndex];
    if (!item) return;
    const rect = item.target().getBoundingClientRect();
    const pad = 5;
    elements.spotlight.style.setProperty('--spot-left', `${rect.left - pad}px`);
    elements.spotlight.style.setProperty('--spot-top', `${rect.top - pad}px`);
    elements.spotlight.style.setProperty('--spot-width', `${rect.width + pad * 2}px`);
    elements.spotlight.style.setProperty('--spot-height', `${rect.height + pad * 2}px`);
    const cardTop = Math.min(window.innerHeight - 190, Math.max(rect.bottom + 18, 135));
    elements.card.style.setProperty('--card-top', `${cardTop}px`);
    elements.finger.style.setProperty('--finger-left', `${rect.left + rect.width * 0.55}px`);
    elements.finger.style.setProperty('--finger-top', `${rect.top + rect.height * 0.5}px`);
    elements.finger.classList.toggle('show', Boolean(item.tap));
  }

  function showHudStep(index: number): void {
    hudIndex = Math.max(0, Math.min(hudSteps.length - 1, index));
    const item = hudSteps[hudIndex];
    if (!item) return;
    elements.step.textContent = `${hudIndex + 1} / ${hudSteps.length}`;
    elements.text.textContent = item.text;
    elements.next.textContent = hudIndex === hudSteps.length - 1 ? 'PLAY' : 'NEXT';
    requestAnimationFrame(positionHudStep);
  }

  function finishHudTour(skipped: boolean): void {
    if (!hudTourActive) return;
    hudTourActive = false;
    resetVisuals();
    dependencies.onHudTourFinish(skipped);
  }

  function advanceHudTour(): void {
    if (!hudTourActive) return;
    if (hudIndex >= hudSteps.length - 1) {
      finishHudTour(false);
      return;
    }
    dependencies.onHudStepAdvance();
    showHudStep(hudIndex + 1);
  }

  function startHudTour(): void {
    hudTourActive = true;
    hudIndex = 0;
    elements.coach.classList.remove('show');
    elements.coach.setAttribute('aria-hidden', 'true');
    syncClasses();
    elements.overlay.classList.add('show');
    elements.overlay.setAttribute('aria-hidden', 'false');
    dependencies.onHudTourStart();
    showHudStep(0);
  }

  elements.skip.addEventListener('click', () => finishHudTour(true));
  elements.next.addEventListener('click', advanceHudTour);
  window.addEventListener('resize', () => {
    if (hudTourActive) requestAnimationFrame(positionHudStep);
  });

  return {
    isHudTourActive: () => hudTourActive,
    syncClasses,
    showLevelGuide,
    dismissLevelGuide,
    resetVisuals,
    startHudTour,
  };
}
