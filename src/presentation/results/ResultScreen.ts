import { formatCoinAmount, roundCoinAmount } from '../../data/economy';
import type { StarPerformanceReport } from '../../domains/campaign/StarRules';

export interface ResultScreenModel {
  win: boolean;
  title: string;
  stars: StarPerformanceReport['stars'];
  starReport: StarPerformanceReport;
  runCoins: number;
  payout: number;
  multiplier: number;
  walletBefore: number;
  walletAfter: number;
  resultHtml: string;
  buttonLabel: string;
  showReplay: boolean;
}

export interface ResultScreenDependencies {
  writeAnimatedWallet(value: number): void;
  writeSettledWallet(value: number): void;
}

export interface ResultScreen {
  reset(): void;
  show(model: ResultScreenModel): void;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Result screen requires ${selector}`);
  return element;
}

export function createResultScreen(dependencies: ResultScreenDependencies): ResultScreen {
  const elements = {
    overlay: requireElement<HTMLElement>('#overlay'),
    card: requireElement<HTMLElement>('#resultCard'),
    title: requireElement<HTMLElement>('#resultTitle'),
    badge: requireElement<HTMLElement>('#completionBadge'),
    confetti: requireElement<HTMLElement>('#confettiField'),
    stars: requireElement<HTMLElement>('#stars'),
    requirements: requireElement<HTMLElement>('#starRequirements'),
    requirementsScore: requireElement<HTMLElement>('#starRequirementsScore'),
    transfer: requireElement<HTMLElement>('#coinTransfer'),
    runCoins: requireElement<HTMLElement>('#resultRunCoins'),
    multiplier: requireElement<HTMLElement>('#resultMultiplierBadge'),
    walletCoins: requireElement<HTMLElement>('#resultWalletCoins'),
    walletBucket: requireElement<HTMLElement>('#resultWalletBucket'),
    text: requireElement<HTMLElement>('#resultText'),
    buttons: requireElement<HTMLElement>('.resultButtons'),
    replay: requireElement<HTMLButtonElement>('#replayLevel'),
    again: requireElement<HTMLButtonElement>('#again'),
  };
  let animationToken = 0;
  let confettiTimeout: ReturnType<typeof setTimeout> | undefined;

  function clearConfetti(): void {
    if (confettiTimeout !== undefined) {
      clearTimeout(confettiTimeout);
      confettiTimeout = undefined;
    }
    elements.confetti.replaceChildren();
  }

  function launchConfetti(): void {
    clearConfetti();
    const palette = ['#ffcf4d', '#ff6f91', '#68c7ff', '#8de07a', '#a77cff', '#ff914d', '#ffffff'];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 72; index += 1) {
      const piece = document.createElement('i');
      piece.className = 'confettiPiece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = palette[index % palette.length];
      piece.style.setProperty('--dur', `${1.65 + Math.random() * 1.25}s`);
      piece.style.setProperty('--delay', `${Math.random() * 0.34}s`);
      piece.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
      piece.style.setProperty('--spin', `${(300 + Math.random() * 900) * (Math.random() < 0.5 ? -1 : 1)}deg`);
      piece.style.width = `${6 + Math.random() * 7}px`;
      piece.style.height = `${9 + Math.random() * 10}px`;
      fragment.appendChild(piece);
    }
    elements.confetti.appendChild(fragment);
    confettiTimeout = setTimeout(clearConfetti, 3300);
  }

  function renderRequirements(report: StarPerformanceReport): void {
    elements.requirementsScore.textContent = `${report.stars} / 3 EARNED`;
    elements.requirements.dataset.stars = String(report.stars);
    for (const requirement of report.requirements) {
      const row = elements.requirements.querySelector<HTMLElement>(`[data-requirement="${requirement.key}"]`);
      if (!row) continue;
      row.dataset.status = requirement.passed ? 'earned' : 'missed';
      const status = row.querySelector<HTMLElement>('.starRequirementStatus');
      if (status) {
        status.textContent = requirement.passed ? '✓' : '✕';
        status.setAttribute('aria-label', requirement.passed ? 'Earned' : 'Missed');
        status.title = requirement.passed ? 'Earned' : 'Missed';
      }
    }
  }

  function animateRewardTransfer(model: ResultScreenModel): void {
    const token = ++animationToken;
    const walletDelta = roundCoinAmount(model.walletAfter - model.walletBefore);
    const levelCoins = Math.max(0, roundCoinAmount(model.payout));
    const duration = Math.min(1600, 700 + Math.abs(walletDelta) * 28);
    const start = performance.now();

    elements.transfer.classList.add('transferring');
    elements.runCoins.textContent = levelCoins > 0 ? `+${formatCoinAmount(levelCoins)}` : '0';
    elements.multiplier.textContent = `×${Number(model.multiplier.toFixed(2)).toString()}`;
    elements.multiplier.classList.toggle('show', model.win);
    elements.walletCoins.textContent = formatCoinAmount(model.walletBefore);
    dependencies.writeAnimatedWallet(model.walletBefore);

    function frame(now: number): void {
      if (token !== animationToken) return;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const shownWallet = roundCoinAmount(model.walletBefore + walletDelta * eased);

      elements.walletCoins.textContent = formatCoinAmount(shownWallet);
      dependencies.writeAnimatedWallet(shownWallet);

      if (Math.abs(walletDelta) > 0 && Math.floor(progress * 10) % 3 === 0) {
        elements.walletBucket.classList.remove('walletPunch');
        void elements.walletBucket.offsetWidth;
        elements.walletBucket.classList.add('walletPunch');
      }

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      elements.transfer.classList.remove('transferring');
      elements.walletCoins.textContent = formatCoinAmount(model.walletAfter);
      dependencies.writeSettledWallet(model.walletAfter);
      elements.walletBucket.classList.add('walletPunch');
    }

    requestAnimationFrame(frame);
  }

  function reset(): void {
    animationToken += 1;
    clearConfetti();
    elements.transfer.classList.remove('transferring');
    elements.card.classList.remove('celebrate', 'defeat');
    elements.badge.classList.remove('show');
    elements.multiplier.classList.remove('show');
    elements.walletBucket.classList.remove('walletPunch');
    elements.buttons.classList.remove('hasReplay');
    elements.replay.hidden = true;
    elements.overlay.classList.remove('defeatResult', 'victoryResult');
    elements.overlay.style.display = 'none';
  }

  function show(model: ResultScreenModel): void {
    elements.title.textContent = model.title;
    elements.stars.textContent = model.win
      ? `${'★'.repeat(model.stars)}${'☆'.repeat(3 - model.stars)}`
      : '☆☆☆';
    renderRequirements(model.starReport);
    elements.text.innerHTML = model.resultHtml;
    elements.buttons.classList.toggle('hasReplay', model.showReplay);
    elements.replay.hidden = !model.showReplay;
    elements.again.textContent = model.buttonLabel;
    elements.overlay.classList.toggle('defeatResult', !model.win);
    elements.overlay.classList.toggle('victoryResult', model.win);
    elements.card.classList.toggle('defeat', !model.win);
    elements.overlay.style.display = 'grid';

    elements.card.classList.remove('celebrate');
    elements.badge.classList.remove('show');
    void elements.card.offsetWidth;
    elements.card.classList.add('celebrate');
    elements.badge.textContent = model.win ? 'CONGRATULATIONS!' : 'RUN ENDED';
    elements.badge.classList.add('show');
    if (model.win) launchConfetti();
    else clearConfetti();
    animateRewardTransfer(model);
  }

  return { reset, show };
}
