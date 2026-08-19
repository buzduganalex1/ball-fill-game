import { describe, expect, it } from 'vitest';
import { isGuidedOnboardingLevel } from '../../src/domains/onboarding/OnboardingRules';

describe('onboarding rules', () => {
  it('guides only the first two levels after the starter pack and before completion', () => {
    const context = { starterPackOpened: true, tutorialSeen: false, currentLevel: 1 };
    expect(isGuidedOnboardingLevel(context)).toBe(true);
    expect(isGuidedOnboardingLevel(context, 2)).toBe(true);
    expect(isGuidedOnboardingLevel(context, 3)).toBe(false);
    expect(isGuidedOnboardingLevel({ ...context, tutorialSeen: true })).toBe(false);
    expect(isGuidedOnboardingLevel({ ...context, starterPackOpened: false })).toBe(false);
  });
});
