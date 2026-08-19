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

  const startTime = Number(await page.locator('#time').textContent());
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
  await expect.poll(async () => Number(await page.locator('#time').textContent())).toBeLessThan(startTime);

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
  await page.locator('#homeCollectionCard').click();
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
