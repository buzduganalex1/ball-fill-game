import type { StoreViewModel } from '../../application/store/StoreViewModel';

export type StoreProduct = 'pack' | 'apex' | 'cataclysm' | 'gaia';

export interface StoreScreenDependencies {
  onBuyPack(): void;
  onBuyApex(): void;
  onBuyCataclysm(): void;
  onBuyGaia(): void;
  onPackPortalReady(): void;
  onPackTransition(active: boolean): void;
  onPurchaseFeedback(): void;
  vibrate(pattern: number[]): void;
}

export interface StoreScreen {
  render(model: StoreViewModel): void;
  setMessage(message: string): void;
  celebratePurchase(product: StoreProduct, label: string): void;
  transitionToPack(): boolean;
  isTransitioning(): boolean;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Store screen requires ${selector}`);
  return element;
}

export function createStoreScreen(dependencies: StoreScreenDependencies): StoreScreen {
  const elements = {
    screen: requireElement<HTMLElement>('#storeScreen'),
    hero: requireElement<HTMLElement>('#storeHero'),
    effects: requireElement<HTMLElement>('#storeFxLayer'),
    wallet: requireElement<HTMLElement>('#storeWalletCoins'),
    packPrice: requireElement<HTMLElement>('#storePackPrice'),
    apexPrice: requireElement<HTMLElement>('#apexPriceLabel'),
    cataclysmPrice: requireElement<HTMLElement>('#cataclysmPriceLabel'),
    gaiaPrice: requireElement<HTMLElement>('#gaiaPriceLabel'),
    message: requireElement<HTMLElement>('#storeMessage'),
    buyPack: requireElement<HTMLButtonElement>('#buyPack'),
    buyApex: requireElement<HTMLButtonElement>('#buyApexBall'),
    buyCataclysm: requireElement<HTMLButtonElement>('#buyCataclysmBall'),
    buyGaia: requireElement<HTMLButtonElement>('#buyGaiaBall'),
    gameStore: requireElement<HTMLElement>('#gameToStore'),
    quickStore: requireElement<HTMLElement>('#quickStore'),
    apexCard: requireElement<HTMLElement>('.mythicStoreCard'),
    cataclysmCard: requireElement<HTMLElement>('.cataclysmStoreCard'),
    gaiaCard: requireElement<HTMLElement>('.gaiaStoreCard'),
  };
  let transitioning = false;

  elements.buyPack.addEventListener('click', dependencies.onBuyPack);
  elements.buyApex.addEventListener('click', dependencies.onBuyApex);
  elements.buyCataclysm.addEventListener('click', dependencies.onBuyCataclysm);
  elements.buyGaia.addEventListener('click', dependencies.onBuyGaia);

  function render(model: StoreViewModel): void {
    elements.wallet.textContent = model.wallet;
    elements.packPrice.textContent = String(model.packPrice);
    elements.apexPrice.textContent = '5000';
    elements.cataclysmPrice.textContent = String(model.impossiblePrice);
    elements.gaiaPrice.textContent = String(model.impossiblePrice);
    elements.buyPack.disabled = !model.packEnabled;
    elements.gameStore.classList.toggle('canBuy', model.canBuyPack);
    elements.gameStore.classList.toggle('purchaseReady', model.canBuyPack);
    elements.quickStore.classList.toggle('purchaseReady', model.quickStoreReady);
    elements.hero.classList.toggle('canBuyPack', model.canBuyPack);
    elements.buyPack.classList.toggle('purchaseReady', model.canBuyPack);

    const products = [
      [elements.buyApex, model.apexOwned, model.apexReady, 'BUY APEX BALL'],
      [elements.buyCataclysm, model.cataclysmOwned, model.cataclysmReady, 'BUY CATACLYSM'],
      [elements.buyGaia, model.gaiaOwned, model.gaiaReady, 'BUY GAIA'],
    ] as const;
    for (const [button, owned, ready, label] of products) {
      button.textContent = owned ? 'OWNED' : label;
      button.disabled = false;
      button.classList.toggle('shopBuyOwned', owned);
      button.classList.toggle('purchaseReady', ready);
    }
  }

  function confetti(count: number, bright = false): void {
    const palette = bright
      ? ['#fff7b0', '#ffd445', '#ffffff', '#ff8ecb', '#7de7ff', '#cba1ff']
      : ['#ffd445', '#ff8a66', '#73d5ff', '#91df76', '#b991ff', '#ffffff'];
    const fragment = document.createDocumentFragment();
    const pieces: HTMLElement[] = [];
    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement('i');
      piece.className = 'shopConfetti';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = palette[index % palette.length];
      piece.style.setProperty('--dur', `${1.15 + Math.random() * 1.15}s`);
      piece.style.setProperty('--delay', `${Math.random() * .22}s`);
      piece.style.setProperty('--drift', `${-110 + Math.random() * 220}px`);
      piece.style.setProperty('--spin', `${(360 + Math.random() * 950) * (Math.random() < .5 ? -1 : 1)}deg`);
      piece.style.width = `${5 + Math.random() * 7}px`;
      piece.style.height = `${8 + Math.random() * 11}px`;
      fragment.appendChild(piece);
      pieces.push(piece);
    }
    elements.effects.appendChild(fragment);
    setTimeout(() => pieces.forEach((piece) => piece.remove()), 2700);
  }

  function radialBurst(count: number, x: number, y: number): void {
    const colors = ['#f4bd37', '#4fcf79', '#ff7f70', '#79cbe0', '#ffffff'];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'purchaseBurstParticle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--particle-angle', `${index * (360 / count) + Math.random() * 11 - 5.5}deg`);
      particle.style.setProperty('--particle-distance', `${72 + Math.random() * 118}px`);
      particle.style.setProperty('--particle-delay', `${(index % 5) * 22}ms`);
      particle.style.setProperty('--particle-duration', `${.9 + Math.random() * .45}s`);
      particle.style.setProperty('--particle-color', colors[index % colors.length]);
      fragment.appendChild(particle);
    }
    elements.effects.appendChild(fragment);
  }

  function celebratePurchase(product: StoreProduct, label: string): void {
    dependencies.onPurchaseFeedback();
    const target = product === 'pack'
      ? elements.hero
      : product === 'apex'
        ? elements.apexCard
        : product === 'cataclysm'
          ? elements.cataclysmCard
          : elements.gaiaCard;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + Math.min(rect.height * .7, rect.height - 28);
    elements.effects.querySelectorAll('.purchaseSuccessBanner,.purchaseBurstParticle').forEach((node) => node.remove());
    elements.effects.classList.remove('purchaseFlash');
    elements.screen.classList.remove('purchaseScreenShake');
    document.querySelectorAll('#storeScreen .purchaseBoom').forEach((node) => node.classList.remove('purchaseBoom'));
    elements.effects.style.setProperty('--purchase-x', `${centerX}px`);
    elements.effects.style.setProperty('--purchase-y', `${centerY}px`);
    void elements.effects.offsetWidth;
    elements.effects.classList.add('purchaseFlash');
    elements.screen.classList.add('purchaseScreenShake');
    target.classList.add('purchaseBoom');
    const banner = document.createElement('div');
    banner.className = 'purchaseSuccessBanner';
    banner.setAttribute('role', 'status');
    banner.textContent = `★ ${label} ★`;
    elements.effects.appendChild(banner);
    radialBurst(34, centerX, centerY);
    [...elements.effects.querySelectorAll('.purchaseBurstParticle')]
      .filter((_, index) => index % 4 === 0)
      .forEach((node) => node.classList.add('coinParticle'));
    confetti(92);
    setTimeout(() => confetti(54, true), 190);
    dependencies.vibrate([24, 28, 42]);
    setTimeout(() => {
      elements.effects.classList.remove('purchaseFlash');
      elements.screen.classList.remove('purchaseScreenShake');
      target.classList.remove('purchaseBoom');
    }, 1250);
    setTimeout(() => {
      banner.remove();
      elements.effects.querySelectorAll('.purchaseBurstParticle').forEach((node) => node.remove());
    }, 1550);
  }

  function transitionToPack(): boolean {
    if (transitioning) return false;
    transitioning = true;
    elements.screen.classList.add('packTransitionOut');
    elements.effects.classList.add('packPortalTransition');
    setTimeout(() => {
      dependencies.onPackPortalReady();
      dependencies.onPackTransition(true);
      setTimeout(() => {
        elements.screen.classList.remove('packTransitionOut');
        elements.effects.classList.remove('packPortalTransition');
        dependencies.onPackTransition(false);
        transitioning = false;
      }, 720);
    }, 430);
    return true;
  }

  return {
    render,
    setMessage: (message) => { elements.message.textContent = message; },
    celebratePurchase,
    transitionToPack,
    isTransitioning: () => transitioning,
  };
}
