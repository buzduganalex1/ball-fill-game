import { BALL_BENEFITS, BALL_IDS, BALL_TYPES, type BallId, type BallRarity } from '../../data/balls';
import { setBallAssetBackground } from '../assets/ballAssets';

export interface CollectionScreenModel {
  ownedBallIds: ReadonlySet<BallId>;
  equippedBallId: BallId;
  previewBallId: BallId;
}

export interface CollectionScreenDependencies {
  onEquip(type: BallId): void;
  onEquipCelebration(): void;
}

export interface CollectionScreen {
  render(model: CollectionScreenModel): void;
  focus(type: BallId, smooth?: boolean): void;
  celebrateEquip(type: BallId): void;
}

const RARITY_CLASS: Record<BallRarity, string> = {
  Common: 'commonRarity',
  Rare: 'rareRarity',
  Epic: 'epicRarity',
  Legendary: 'legendaryRarity',
  Mythic: 'mythicRarityTag',
  Impossible: 'impossibleRarityTag',
};

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Collection screen requires ${selector}`);
  return element;
}

export function createCollectionScreen(dependencies: CollectionScreenDependencies): CollectionScreen {
  const root = requireElement<HTMLElement>('#collectionScreen');
  const scroller = requireElement<HTMLElement>('#collectionScreen .menuApp');
  const detailName = requireElement<HTMLElement>('#collectionEquippedName');
  const detailDescription = requireElement<HTMLElement>('#collectionEquippedDesc');
  const detailRarity = requireElement<HTMLElement>('#collectionDetailRarity');
  const detailPanel = requireElement<HTMLElement>('#collectionDetailPanel');
  const cards = Object.fromEntries(
    BALL_IDS.map((type) => [type, requireElement<HTMLElement>(`#${type}Card`)]),
  ) as Record<BallId, HTMLElement>;
  const buttons = Object.fromEntries(
    BALL_IDS.map((type) => {
      const id = `equip${type[0]?.toUpperCase()}${type.slice(1)}`;
      return [type, requireElement<HTMLButtonElement>(`#${id}`)];
    }),
  ) as Record<BallId, HTMLButtonElement>;
  const locks = Object.fromEntries(
    BALL_IDS.filter((type) => type !== 'normal').map((type) => [
      type,
      requireElement<HTMLElement>(`#${type}Lock`),
    ]),
  ) as Partial<Record<BallId, HTMLElement>>;
  let scrollIdleTimer: ReturnType<typeof setTimeout> | undefined;

  for (const type of BALL_IDS) {
    setBallAssetBackground(cards[type].querySelector<HTMLElement>('.collectionBall'), type);
    buttons[type].addEventListener('click', () => dependencies.onEquip(type));
  }

  function finishScroll(): void {
    if (scrollIdleTimer !== undefined) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = undefined;
    scroller.classList.remove('collectionScrolling');
  }

  function markScrolling(): void {
    scroller.classList.add('collectionScrolling');
    if (scrollIdleTimer !== undefined) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(finishScroll, 140);
  }

  function stopAutoScroll(): void {
    const currentTop = scroller.scrollTop;
    scroller.style.scrollBehavior = 'auto';
    scroller.scrollTo({ top: currentTop, behavior: 'auto' });
    requestAnimationFrame(() => scroller.style.removeProperty('scroll-behavior'));
  }

  scroller.addEventListener('pointerdown', stopAutoScroll, { passive: true });
  scroller.addEventListener('scroll', markScrolling, { passive: true });
  scroller.addEventListener('scrollend', finishScroll, { passive: true });

  function render(model: CollectionScreenModel): void {
    for (const type of BALL_IDS) {
      const owned = model.ownedBallIds.has(type);
      const equipped = model.equippedBallId === type && owned;
      const card = cards[type];
      const button = buttons[type];

      card.classList.toggle('lockedCard', !owned);
      card.classList.toggle('equipped', equipped);
      card.classList.toggle('previewed', model.previewBallId === type);
      card.classList.remove('collectionEquipTarget');
      card.removeAttribute('role');
      card.removeAttribute('tabindex');
      card.removeAttribute('aria-pressed');
      card.removeAttribute('aria-label');

      const description = card.querySelector<HTMLElement>('p');
      const stat = card.querySelector<HTMLElement>('.statRow');
      if (description) description.textContent = BALL_TYPES[type].desc;
      if (stat) {
        const label = stat.querySelector<HTMLElement>('span');
        const value = stat.querySelector<HTMLElement>('strong');
        if (label) label.textContent = 'WHAT IT GIVES';
        if (value) value.textContent = BALL_BENEFITS[type];
      }

      button.disabled = !owned || equipped;
      button.classList.toggle('equippedButton', equipped);
      button.setAttribute('aria-pressed', equipped ? 'true' : 'false');
      button.textContent = equipped ? '✓ EQUIPPED' : owned ? 'EQUIP' : 'LOCKED';
      const lock = locks[type];
      if (lock) lock.style.display = owned ? 'none' : 'block';
    }

    const grid = cards.normal.parentElement;
    if (grid) {
      const sortedTypes = [
        ...BALL_IDS.filter((type) => model.ownedBallIds.has(type)),
        ...BALL_IDS.filter((type) => !model.ownedBallIds.has(type)),
      ];
      const orderedCards = sortedTypes.map((type) => cards[type]);
      if (orderedCards.some((card, index) => grid.children[index] !== card)) grid.append(...orderedCards);
    }

    const preview = BALL_TYPES[model.previewBallId];
    detailName.textContent = preview.name;
    detailDescription.textContent = preview.desc;
    detailRarity.textContent = preview.rarity.toUpperCase();
    detailRarity.className = `collectionDetailRarity ${RARITY_CLASS[preview.rarity]}`;
    detailPanel.classList.toggle('previewLocked', !model.ownedBallIds.has(model.previewBallId));
  }

  function focus(type: BallId, smooth = true): void {
    const card = cards[type];
    if (!root.classList.contains('active')) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = smooth && !reduceMotion ? 'smooth' : 'auto';
    if (card.parentElement?.firstElementChild === card) scroller.scrollTo({ top: 0, behavior });
    else card.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
  }

  function celebrateEquip(type: BallId): void {
    const card = cards[type];
    const ball = card.querySelector<HTMLElement>('.collectionBall');
    if (!ball) return;

    document.querySelectorAll('.equipCelebrationBadge,.equipSparkBurst').forEach((element) => element.remove());
    document.querySelectorAll('.ballCard.equipCelebrating').forEach((element) => element.classList.remove('equipCelebrating'));

    const cardRect = card.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();
    const burst = document.createElement('div');
    burst.className = 'equipSparkBurst';
    burst.style.left = `${ballRect.left - cardRect.left + ballRect.width / 2}px`;
    burst.style.top = `${ballRect.top - cardRect.top + ballRect.height / 2}px`;
    for (let index = 0; index < 14; index += 1) {
      const spark = document.createElement('i');
      spark.className = 'equipSpark';
      spark.style.setProperty('--spark-angle', `${index * (360 / 14)}deg`);
      spark.style.setProperty('--spark-distance', `${3.7 + (index % 4) * 0.42}rem`);
      spark.style.setProperty('--spark-delay', `${(index % 3) * 28}ms`);
      burst.appendChild(spark);
    }

    const badge = document.createElement('div');
    badge.className = 'equipCelebrationBadge';
    badge.setAttribute('role', 'status');
    badge.textContent = `✓ ${BALL_TYPES[type].name.toUpperCase()} EQUIPPED!`;
    card.append(burst, badge);
    void card.offsetWidth;
    card.classList.add('equipCelebrating');
    dependencies.onEquipCelebration();

    setTimeout(() => {
      card.classList.remove('equipCelebrating');
      burst.remove();
      badge.remove();
    }, 1050);
  }

  return { render, focus, celebrateEquip };
}
