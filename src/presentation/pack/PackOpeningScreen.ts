import { BALL_BENEFITS, BALL_TYPES, type BallId } from '../../data/balls';
import { PACK_PRICE } from '../../data/economy';
import { setBallAssetBackground } from '../assets/ballAssets';

export type PackMode = 'starter' | 'paid';

export interface PackOpeningDependencies {
  nativeHapticsAvailable: boolean;
  onOpen(): void;
  onBuyAnother(): void;
  onContinue(): void;
  playRevealSound(): void;
  triggerFeedback(style: 'success' | 'medium'): void;
  vibrate(pattern: number[]): void;
}

export interface PackOpeningScreen {
  isOpen(): boolean;
  show(mode: PackMode, currentLevel: number): void;
  hide(): void;
  beginOpening(): boolean;
  reveal(model: { mode: PackMode; reward: BallId; duplicate: boolean }): void;
  renderLoadout(reward: BallId | null, equippedBallId: BallId): void;
  renderBuyAnother(canBuy: boolean): void;
  showInsufficientCoins(missingCoins: number): void;
  beginRepurchase(): void;
  setTransitionIn(active: boolean): void;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Pack opening screen requires ${selector}`);
  return element;
}

export function createPackOpeningScreen(dependencies: PackOpeningDependencies): PackOpeningScreen {
  const elements = {
    overlay: requireElement<HTMLElement>('#packOverlay'),
    modal: requireElement<HTMLElement>('#packModal'),
    title: requireElement<HTMLElement>('#packTitle'),
    subtitle: requireElement<HTMLElement>('#packSub'),
    pack: requireElement<HTMLElement>('#bigPack'),
    reveal: requireElement<HTMLElement>('#rewardReveal'),
    ball: requireElement<HTMLElement>('#rewardBall'),
    name: requireElement<HTMLElement>('#rewardName'),
    rarity: requireElement<HTMLElement>('#rewardRarity'),
    description: requireElement<HTMLElement>('#rewardDesc'),
    benefit: requireElement<HTMLElement>('#rewardBenefit'),
    loadout: requireElement<HTMLElement>('#packLoadoutStatus'),
    loadoutIcon: requireElement<HTMLElement>('#packLoadoutStatusIcon'),
    loadoutTitle: requireElement<HTMLElement>('#packLoadoutStatusTitle'),
    loadoutDetail: requireElement<HTMLElement>('#packLoadoutStatusDetail'),
    buyAnother: requireElement<HTMLButtonElement>('#buyAnotherPack'),
    continueButton: requireElement<HTMLButtonElement>('#packContinue'),
    effects: requireElement<HTMLElement>('#packFxLayer'),
  };
  let celebrationToken = 0;

  elements.pack.addEventListener('click', dependencies.onOpen);
  elements.buyAnother.addEventListener('click', dependencies.onBuyAnother);
  elements.continueButton.addEventListener('click', dependencies.onContinue);
  setBallAssetBackground(elements.ball, 'normal');

  function confetti(count: number, quick = false): void {
    const colors = ['#fff7b0', '#ffd445', '#ffffff', '#ff8ecb', '#7de7ff', '#cba1ff'];
    const fragment = document.createDocumentFragment();
    const pieces: HTMLElement[] = [];
    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement('i');
      piece.className = 'shopConfetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty('--dur', `${quick ? .82 + Math.random() * .48 : 1.15 + Math.random() * 1.15}s`);
      piece.style.setProperty('--delay', `${Math.random() * (quick ? .08 : .22)}s`);
      piece.style.setProperty('--drift', `${-110 + Math.random() * 220}px`);
      piece.style.setProperty('--spin', `${(360 + Math.random() * 950) * (Math.random() < .5 ? -1 : 1)}deg`);
      piece.style.width = `${5 + Math.random() * 7}px`;
      piece.style.height = `${8 + Math.random() * 11}px`;
      fragment.appendChild(piece);
      pieces.push(piece);
    }
    elements.effects.appendChild(fragment);
    setTimeout(() => pieces.forEach((piece) => piece.remove()), quick ? 1500 : 2700);
  }

  function radialBurst(count: number, x: number, y: number, colors: string[]): void {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'packMegaSpark';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--particle-angle', `${index * (360 / count) + Math.random() * 11 - 5.5}deg`);
      particle.style.setProperty('--particle-distance', `${88 + Math.random() * 162}px`);
      particle.style.setProperty('--particle-delay', `${(index % 5) * 22}ms`);
      particle.style.setProperty('--particle-duration', `${.9 + Math.random() * .45}s`);
      particle.style.setProperty('--particle-color', colors[index % colors.length]);
      fragment.appendChild(particle);
    }
    elements.effects.appendChild(fragment);
  }

  function celebrateReveal(type: BallId, isNew: boolean): void {
    dependencies.triggerFeedback(isNew ? 'success' : 'medium');
    dependencies.playRevealSound();
    const token = ++celebrationToken;
    const data = BALL_TYPES[type];
    const revealColor = {
      Common: '#85a9ba', Rare: '#28a9df', Epic: '#ad59de',
      Legendary: '#ffad22', Mythic: '#ed56d8', Impossible: '#ff624d',
    }[data.rarity];
    const ballRect = elements.ball.getBoundingClientRect();
    const centerX = ballRect.left + ballRect.width / 2;
    const centerY = ballRect.top + ballRect.height / 2;
    elements.effects.querySelectorAll('.packDropBanner,.packMegaSpark').forEach((node) => node.remove());
    elements.effects.classList.remove('openingBurst', 'preRevealCharge');
    elements.modal.classList.remove('revealBoom', 'packAnticipation');
    elements.reveal.classList.remove('megaReveal');
    elements.effects.style.setProperty('--reveal-color', revealColor);
    elements.effects.style.setProperty('--burst-x', `${centerX}px`);
    elements.effects.style.setProperty('--burst-y', `${centerY}px`);
    elements.modal.style.setProperty('--reveal-color', revealColor);
    elements.reveal.style.setProperty('--reward-accent', revealColor);
    void elements.effects.offsetWidth;
    elements.effects.classList.add('openingBurst');
    elements.modal.classList.add('revealBoom');
    elements.reveal.classList.add('megaReveal');
    const banner = document.createElement('div');
    banner.className = 'packDropBanner';
    banner.setAttribute('role', 'status');
    banner.textContent = isNew
      ? `★ NEW ${data.rarity.toUpperCase()} BALL! ★`
      : `★ ${data.rarity.toUpperCase()} REWARD! ★`;
    elements.effects.appendChild(banner);
    radialBurst(
      dependencies.nativeHapticsAvailable ? 20 : 28,
      centerX,
      centerY,
      [revealColor, '#fff6a7', '#ffffff', '#65d7ee', '#f0a1ff'],
    );
    confetti(dependencies.nativeHapticsAvailable ? 68 : 96, true);
    dependencies.vibrate([35, 35, 55, 45, 90]);
    setTimeout(() => {
      if (token !== celebrationToken) return;
      elements.effects.classList.remove('openingBurst');
      elements.modal.classList.remove('revealBoom');
    }, 1850);
    setTimeout(() => {
      if (token !== celebrationToken) return;
      banner.remove();
      elements.effects.querySelectorAll('.packMegaSpark,.shopConfetti').forEach((node) => node.remove());
    }, 1650);
  }

  function renderLoadout(reward: BallId | null, equippedBallId: BallId): void {
    const canEquip = reward !== null;
    const equipped = canEquip && equippedBallId === reward;
    const rewardName = BALL_TYPES[reward ?? 'normal'].name;
    elements.loadout.classList.toggle('isEquipped', equipped);
    elements.loadout.classList.toggle('willEquip', canEquip && !equipped);
    elements.loadoutIcon.textContent = equipped ? '✓' : '→';
    elements.loadoutTitle.textContent = equipped ? 'EQUIPPED & READY' : 'READY TO TRY';
    elements.loadoutDetail.textContent = equipped
      ? `${rewardName} is selected for your next level`
      : `Starting the level equips ${rewardName}`;
  }

  function show(mode: PackMode, currentLevel: number): void {
    celebrationToken += 1;
    elements.overlay.style.display = 'grid';
    elements.overlay.style.pointerEvents = 'auto';
    elements.overlay.setAttribute('aria-hidden', 'false');
    elements.overlay.classList.remove('packTransitionIn');
    document.body.classList.add('packOpen');
    elements.pack.classList.remove('opening', 'opened');
    elements.reveal.classList.remove('show', 'megaReveal');
    elements.continueButton.classList.remove('show');
    elements.buyAnother.classList.remove('show');
    elements.buyAnother.disabled = false;
    elements.loadout.classList.remove('isEquipped', 'willEquip');
    elements.loadoutIcon.textContent = '→';
    elements.loadoutTitle.textContent = 'REWARD READY';
    elements.loadoutDetail.textContent = 'Open the pack to reveal your ball';
    elements.benefit.textContent = 'BALANCED GROWTH';
    elements.effects.classList.remove('openingBurst', 'preRevealCharge');
    elements.modal.classList.remove('revealBoom', 'packAnticipation');
    elements.effects.querySelectorAll('.shopConfetti,.packDropBanner,.packMegaSpark,.packEquipSpark').forEach((node) => node.remove());
    elements.reveal.querySelectorAll('.packEquipConfirmation').forEach((node) => node.remove());
    elements.title.textContent = mode === 'starter' ? 'FREE STARTER PACK' : 'PACK OPENING';
    elements.subtitle.textContent = 'Tap the pack';
    elements.continueButton.textContent = mode === 'starter' ? `START LEVEL ${currentLevel}` : 'PLAY WITH NEW BALL';
  }

  function beginOpening(): boolean {
    if (elements.pack.classList.contains('opening') || elements.pack.classList.contains('opened')) return false;
    elements.pack.classList.add('opening');
    elements.subtitle.textContent = 'HOLD ON…';
    elements.modal.classList.add('packAnticipation');
    setTimeout(() => {
      if (!elements.pack.classList.contains('opening')) return;
      elements.effects.classList.remove('preRevealCharge');
      void elements.effects.offsetWidth;
      elements.effects.classList.add('preRevealCharge');
    }, 620);
    return true;
  }

  function reveal(model: { mode: PackMode; reward: BallId; duplicate: boolean }): void {
    const data = BALL_TYPES[model.reward];
    const rewardClasses: Partial<Record<BallId, string>> = {
      normal: 'normalReward', swift: 'swiftReward', shield: 'shieldReward',
      magnet: 'magnetReward', coin: 'coinReward', giant: 'giantReward',
      ghost: 'ghostReward', legendary: 'legendaryReward',
    };
    const rewardClass = rewardClasses[model.reward] ?? 'normalReward';
    elements.pack.classList.add('opened');
    elements.continueButton.classList.add('show');
    elements.buyAnother.classList.toggle('show', model.mode === 'paid');
    elements.subtitle.textContent = model.mode === 'starter' ? 'STARTER BALL UNLOCKED' : 'NEW BALL UNLOCKED';
    elements.modal.classList.remove('packAnticipation');
    elements.ball.className = `rewardBall ${rewardClass}`;
    setBallAssetBackground(elements.ball, model.reward);
    elements.name.textContent = data.name.toUpperCase();
    elements.rarity.textContent = `${data.rarity.toUpperCase()} BALL`;
    elements.description.textContent = `${data.desc}${model.duplicate && model.mode !== 'starter' ? ' • DUPLICATE' : ''}`;
    elements.benefit.textContent = BALL_BENEFITS[model.reward] ?? 'SPECIAL POWER';
    if (model.mode === 'paid') elements.continueButton.textContent = `PLAY WITH ${data.name.toUpperCase()}`;
    elements.reveal.classList.add('show');
    celebrateReveal(model.reward, !model.duplicate);
  }

  function renderBuyAnother(canBuy: boolean): void {
    elements.buyAnother.disabled = !canBuy;
    elements.buyAnother.classList.toggle('purchaseReady', canBuy);
    elements.buyAnother.textContent = 'BUY ANOTHER';
    elements.buyAnother.setAttribute('aria-label', `Buy another pack for ${PACK_PRICE} coins`);
  }

  function beginRepurchase(): void {
    elements.subtitle.textContent = 'BUYING + OPENING…';
    elements.buyAnother.disabled = true;
    confetti(90);
    dependencies.vibrate([22, 26, 38]);
    elements.modal.classList.remove('revealBoom');
    void elements.modal.offsetWidth;
    elements.modal.classList.add('revealBoom');
  }

  function hide(): void {
    celebrationToken += 1;
    elements.overlay.style.display = 'none';
    elements.overlay.style.pointerEvents = 'none';
    elements.overlay.setAttribute('aria-hidden', 'true');
    elements.overlay.classList.remove('packTransitionIn');
    document.body.classList.remove('packOpen');
    elements.effects.classList.remove('openingBurst', 'preRevealCharge');
    elements.modal.classList.remove('revealBoom', 'packAnticipation');
    elements.pack.classList.remove('opening', 'opened');
    elements.reveal.classList.remove('show', 'megaReveal');
    elements.continueButton.classList.remove('show');
    elements.buyAnother.classList.remove('show');
    elements.effects.querySelectorAll('.shopConfetti,.packDropBanner,.packMegaSpark,.packEquipSpark').forEach((node) => node.remove());
    elements.reveal.querySelectorAll('.packEquipConfirmation').forEach((node) => node.remove());
  }

  return {
    isOpen: () => elements.overlay.getAttribute('aria-hidden') === 'false',
    show,
    hide,
    beginOpening,
    reveal,
    renderLoadout,
    renderBuyAnother,
    showInsufficientCoins: (missing) => { elements.subtitle.textContent = `NEED ${missing} MORE COINS`; },
    beginRepurchase,
    setTransitionIn: (active) => elements.overlay.classList.toggle('packTransitionIn', active),
  };
}
