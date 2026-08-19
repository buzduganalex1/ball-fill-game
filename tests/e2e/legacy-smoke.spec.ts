import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('starter pack leads into responsive touch gameplay and navigation', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#homeScreen')).toHaveClass(/active/);
  await expect(page.locator('body')).toHaveAttribute('data-game-renderer', /phaser-(webgl|canvas)/);
  await expect(page.locator('#phaserArena canvas')).toHaveCount(1);
  await expect(page.locator('#packOverlay')).toHaveAttribute('aria-hidden', 'false');

  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  await expect(page.locator('#time')).toHaveText('—');
  await canvas.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box!.x + box!.width / 2,
    clientY: box!.y + box!.height / 2,
  });
  await page.waitForTimeout(600);
  await canvas.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box!.x + box!.width / 2,
    clientY: box!.y + box!.height / 2,
  });
  await expect(page.locator('#tutorialCoach')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#time')).toHaveText('—');

  await page.locator('#gameToStore').click();
  await expect(page.locator('#storeScreen')).toHaveClass(/active/);
  await page.locator('#quickCollection').click();
  await expect(page.locator('#collectionScreen')).toHaveClass(/active/);

  expect(pageErrors).toEqual([]);
});

test('idle menus stop gameplay canvas rendering', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.clearRect;
    Object.defineProperty(window, '__gameClearCount', { value: 0, writable: true });
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas?.id === 'game') {
        (window as typeof window & { __gameClearCount: number }).__gameClearCount += 1;
      }
      return original.apply(this, args as [number, number, number, number]);
    };
  });

  await page.goto('/');
  await page.waitForTimeout(400);
  const renders = await page.evaluate(() =>
    (window as typeof window & { __gameClearCount: number }).__gameClearCount,
  );
  expect(renders).toBeLessThanOrEqual(1);
  await expect(page.locator('body')).toHaveAttribute('data-game-active', 'false');
});

test('Phaser owns active arena drawing after it becomes ready', async ({ page }) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.clearRect;
    Object.defineProperty(window, '__gameClearCount', { value: 0, writable: true });
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas?.id === 'game') {
        (window as typeof window & { __gameClearCount: number }).__gameClearCount += 1;
      }
      return original.apply(this, args as [number, number, number, number]);
    };
  });

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-game-renderer', /phaser-(webgl|canvas)/);
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();
  await expect(page.locator('body')).toHaveAttribute('data-game-active', 'true');
  await page.evaluate(() => {
    (window as typeof window & { __gameClearCount: number }).__gameClearCount = 0;
  });
  await page.waitForTimeout(500);

  expect(await page.evaluate(() =>
    (window as typeof window & { __gameClearCount: number }).__gameClearCount,
  )).toBe(0);
});

test('legacy renderer remains a playable rollback path', async ({ page }) => {
  await page.goto('/?renderer=legacy');
  await expect(page.locator('body')).toHaveAttribute('data-game-renderer', 'legacy');
  await expect(page.locator('#phaserArena canvas')).toHaveCount(0);

  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();
  await expect(page.locator('body')).toHaveAttribute('data-game-active', 'true');

  const canvas = page.locator('#game');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await canvas.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box!.x + box!.width / 2,
    clientY: box!.y + box!.height / 2,
  });
  await page.waitForTimeout(300);
  await canvas.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: box!.x + box!.width / 2,
    clientY: box!.y + box!.height / 2,
  });
  await expect(page.locator('#balls')).toHaveText('9');
});

test('pack reward stays spacious on mobile with a bounded reveal effect', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto('/');
  await page.locator('#bigPack').click();
  await expect(page.locator('#rewardReveal')).toHaveClass(/show/, { timeout: 3_000 });
  // Measure the settled card, not the opening scale keyframe.
  await page.waitForTimeout(1_250);

  const layout = await page.evaluate(() => {
    const modal = document.querySelector<HTMLElement>('#packModal')!;
    const title = document.querySelector<HTMLElement>('#packTitle')!;
    const subtitle = document.querySelector<HTMLElement>('#packSub')!;
    const reward = document.querySelector<HTMLElement>('#rewardReveal')!;
    const actions = document.querySelector<HTMLElement>('.packAfterActions')!;
    const modalRect = modal.getBoundingClientRect();
    const rewardRect = reward.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();

    return {
      modalTop: modalRect.top,
      modalBottom: modalRect.bottom,
      modalHeight: modalRect.height,
      titleTop: title.getBoundingClientRect().top,
      subtitleBottom: subtitle.getBoundingClientRect().bottom,
      rewardTop: rewardRect.top,
      rewardHeight: rewardRect.height,
      rewardBottom: rewardRect.bottom,
      actionsTop: actionsRect.top,
      actionsBottom: actionsRect.bottom,
      scrollFits: modal.scrollHeight <= modal.clientHeight + 1,
      particleCount: document.querySelectorAll('#packFxLayer .shopConfetti, #packFxLayer .packMegaSpark').length,
    };
  });

  expect(layout.modalHeight).toBeGreaterThan(620);
  expect(layout.modalTop).toBeGreaterThanOrEqual(0);
  expect(layout.modalBottom).toBeLessThanOrEqual(720);
  expect(layout.titleTop - layout.modalTop).toBeLessThan(32);
  expect(layout.rewardTop).toBeLessThan(270);
  expect(layout.rewardTop - layout.subtitleBottom).toBeGreaterThan(18);
  expect(layout.rewardHeight).toBeGreaterThan(270);
  expect(layout.actionsTop).toBeGreaterThan(layout.rewardBottom);
  expect(layout.actionsBottom).toBeLessThanOrEqual(layout.modalBottom);
  expect(layout.modalBottom - layout.actionsBottom).toBeLessThan(28);
  expect(layout.scrollFits).toBe(true);
  expect(layout.particleCount).toBeLessThanOrEqual(124);
});

test('collection selection uses native smooth scrolling without list jumps', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto('/');
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();
  await page.locator('#adminBalls').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#hudCollectionButton').click();
  await expect(page.locator('#collectionScreen')).toHaveClass(/active/);

  const initial = await page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>('#collectionScreen .menuApp')!;
    return {
      order: [...document.querySelectorAll<HTMLElement>('#collectionScreen .ballCard')].map(card => card.id),
      behavior: getComputedStyle(scroller).scrollBehavior,
    };
  });
  expect(initial.behavior).toBe('smooth');

  await page.locator('#equipGaia').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#equipGaia')).toHaveClass(/equippedButton/);
  await expect.poll(async () => page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>('#collectionScreen .menuApp')!;
    const card = document.querySelector<HTMLElement>('#gaiaCard')!;
    const style = getComputedStyle(scroller);
    const start = Number.parseFloat(style.scrollPaddingBlockStart) || 0;
    const end = Number.parseFloat(style.scrollPaddingBlockEnd) || 0;
    const viewport = scroller.getBoundingClientRect();
    const targetCenter = viewport.top + start + (viewport.height - start - end) / 2;
    const cardRect = card.getBoundingClientRect();
    return Math.abs(cardRect.top + cardRect.height / 2 - targetCenter);
  }), { timeout: 2_000 }).toBeLessThan(24);

  // A new selection must retarget the browser's native animation cleanly.
  await page.locator('#equipSwift').evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(50);
  await page.locator('#equipNormal').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#equipNormal')).toHaveClass(/equippedButton/);
  await expect.poll(async () => page.evaluate(() => (
    document.querySelector<HTMLElement>('#collectionScreen .menuApp')!.scrollTop
  )), { timeout: 2_000 }).toBeLessThan(2);

  const finalOrder = await page.evaluate(() => (
    [...document.querySelectorAll<HTMLElement>('#collectionScreen .ballCard')].map(card => card.id)
  ));
  expect(finalOrder).toEqual(initial.order);

  const scrollerBox = await page.locator('#collectionScreen .menuApp').boundingBox();
  expect(scrollerBox).not.toBeNull();
  const touchX = scrollerBox!.x + scrollerBox!.width / 2;
  const touchStartY = scrollerBox!.y + scrollerBox!.height * .76;
  const touchEndY = scrollerBox!.y + scrollerBox!.height * .32;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: touchX, y: touchStartY }],
  });
  for (let step = 1; step <= 5; step++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: touchX,
        y: touchStartY + (touchEndY - touchStartY) * step / 5,
      }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect.poll(async () => page.evaluate(() => (
    document.querySelector<HTMLElement>('#collectionScreen .menuApp')!.scrollTop
  ))).toBeGreaterThan(80);
  await expect.poll(async () => page.locator('#collectionScreen .menuApp').evaluate(scroller => (
    !scroller.classList.contains('collectionScrolling')
  ))).toBe(true);
});

test('starter progress, wallet, and inventory survive reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.waitForTimeout(150);

  await expect.poll(async () => page.evaluate(() => {
    const key = Object.keys(localStorage).find(candidate => candidate.endsWith('.ballFillSave'));
    if (!key) return false;
    return Boolean(JSON.parse(localStorage.getItem(key) || '{}').starterPackOpened);
  })).toBe(true);
  await page.reload();

  await expect(page.locator('#packOverlay')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('#adminCoins').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#adminBalls').evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(150);
  await page.reload();

  await expect(page.locator('#homeGold')).toHaveText('5000');
  await page.locator('#quickCollection').click();
  await expect(page.locator('#collectionScreen .ballCard:not(.lockedCard)')).toHaveCount(11);
});

test('paid pack purchase reveals, equips, and returns to Phaser gameplay', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  await page.locator('#adminCoins').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#gameToStore').click();
  await expect(page.locator('#storeWalletCoins')).toHaveText('5000');
  await page.locator('#buyPack').click();
  await expect(page.locator('#packOverlay')).toHaveAttribute('aria-hidden', 'false', { timeout: 3_000 });
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  const rewardName = (await page.locator('#rewardName').textContent())?.trim();
  expect(rewardName).toBeTruthy();
  await page.locator('#packContinue').click();

  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  await expect(page.locator('body')).toHaveAttribute('data-game-renderer', /phaser-(webgl|canvas)/);
  await expect.poll(async () => page.evaluate(() => {
    const key = Object.keys(localStorage).find(candidate => candidate.endsWith('.ballFillSave'));
    if (!key) return false;
    const save = JSON.parse(localStorage.getItem(key) || '{}');
    return save.ownedBallIds?.includes(save.equippedBallId);
  })).toBe(true);
});
