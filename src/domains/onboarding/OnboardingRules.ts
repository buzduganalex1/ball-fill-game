export interface OnboardingContext {
  starterPackOpened: boolean;
  tutorialSeen: boolean;
  currentLevel: number;
}

export function isGuidedOnboardingLevel(context: OnboardingContext, level = context.currentLevel): boolean {
  return context.starterPackOpened && !context.tutorialSeen && (level === 1 || level === 2);
}

export const ONBOARDING_LEVEL_COPY: Readonly<Record<1 | 2, string>> = {
  1: 'Tap, hold, move, grow, and release to fill the screen. Collect as many coins as possible before the progress bar is full.',
  2: 'If enemies hit you while growing, they will pop your ball and your progress will be lost. You have a limited number of balls—grow them as big as possible.',
};
