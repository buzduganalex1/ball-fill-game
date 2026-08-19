import type { EncounterProfile } from '../../data/encounters';

export interface EncounterWarningScreen {
  show(profile: EncounterProfile): void;
  hide(): void;
  isOpen(): boolean;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Encounter warning requires ${selector}`);
  return element;
}

export function createEncounterWarningScreen(onFight: () => void): EncounterWarningScreen {
  const elements = {
    overlay: requireElement<HTMLElement>('#bossWarningOverlay'),
    card: requireElement<HTMLElement>('#bossWarningCard'),
    burst: requireElement<HTMLElement>('#bossWarningBurst'),
    eyebrow: requireElement<HTMLElement>('#bossWarningEyebrow'),
    name: requireElement<HTMLElement>('#bossWarningName'),
    mechanic: requireElement<HTMLElement>('#bossWarningMechanic'),
    description: requireElement<HTMLElement>('#bossWarningDesc'),
    tip: requireElement<HTMLElement>('#bossWarningTip'),
    fight: requireElement<HTMLButtonElement>('#bossFightButton'),
  };
  elements.fight.addEventListener('click', onFight);

  function show(profile: EncounterProfile): void {
    elements.burst.textContent = profile.icon ?? '';
    elements.eyebrow.textContent = profile.eyebrow ?? '';
    elements.name.textContent = profile.name.toUpperCase();
    elements.mechanic.textContent = profile.mechanic ?? '';
    elements.description.textContent = profile.description ?? '';
    elements.tip.textContent = profile.tip ?? '';
    elements.fight.textContent = profile.button ?? 'FIGHT!';
    elements.card.style.setProperty('--boss-fill', profile.fill);
    elements.card.style.setProperty('--boss-edge', profile.edge);
    elements.card.style.setProperty('--boss-glow', profile.glow || profile.edge);
    elements.overlay.style.display = 'grid';
    elements.overlay.setAttribute('aria-hidden', 'false');
  }

  function hide(): void {
    elements.overlay.style.display = 'none';
    elements.overlay.setAttribute('aria-hidden', 'true');
  }

  return {
    show,
    hide,
    isOpen: () => elements.overlay.style.display === 'grid',
  };
}
