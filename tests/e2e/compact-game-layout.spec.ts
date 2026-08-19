import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 720 } });

test('gameplay HUD and expanded arena fit a compact Android viewport without the booster dock', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  // Pause live HUD writes while exercising the content-aware number fitter.
  await page.locator('#gameUtilityMenuButton').click();
  await expect(page.locator('#gameUtilityOverlay')).toHaveClass(/open/);

  // A six-digit wallet and six-digit level gain must fit beside one another.
  await page.locator('#walletCoins').evaluate(element => {
    element.textContent = '100000';
  });
  await page.locator('#coins').evaluate(element => {
    element.textContent = '100000';
  });
  await expect(page.locator('#gameWalletPill')).toHaveAttribute('data-money-fit', 'tight');

  const layout = await page.evaluate(() => {
    const rect = (selector: string) => {
      const bounds = document.querySelector(selector)!.getBoundingClientRect();
      return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    };
    return {
      innerWidth,
      innerHeight,
      app: rect('#gameScreen .app'),
      hud: rect('.gameHudTop'),
      progress: rect('.topProgress'),
      arena: rect('.boardWrap'),
      menu: rect('.gameUtilityMenuButton'),
      ballVisual: rect('#hudBallVisual'),
      timerVisual: rect('.hudTimerVisual'),
      goldVisual: rect('.hudGoldVisual'),
      statusChildCount: document.querySelector('.gameStatusBar')!.children.length,
      levelFontSize: parseFloat(getComputedStyle(document.querySelector('#levelChallenge')!).fontSize),
      progressFontSize: parseFloat(getComputedStyle(document.querySelector('#levelGoal')!).fontSize),
      goldCard: rect('#gameToStore'),
      ballCard: rect('#hudCollectionButton'),
      timerCard: rect('#hudTimerCard'),
      wallet: rect('#walletCoins'),
      runGain: rect('.runGain'),
      moneyFit: document.querySelector<HTMLElement>('#gameWalletPill')!.dataset.moneyFit,
      moneyFontSize: parseFloat(getComputedStyle(document.querySelector('#walletCoins')!).fontSize),
      timerValueFontSize: parseFloat(getComputedStyle(document.querySelector('#time')!).fontSize),
      ballValueFontSize: parseFloat(getComputedStyle(document.querySelector('#balls')!).fontSize),
      walletOverflow: (() => {
        const element = document.querySelector<HTMLElement>('#walletCoins')!;
        return element.scrollWidth - element.clientWidth;
      })(),
      runGainOverflow: (() => {
        const element = document.querySelector<HTMLElement>('.runGain')!;
        return element.scrollWidth - element.clientWidth;
      })(),
      timeOverflow: (() => {
        const element = document.querySelector<HTMLElement>('#time')!;
        return element.scrollWidth - element.clientWidth;
      })(),
    };
  });

  expect(layout.app.bottom).toBeLessThanOrEqual(layout.innerHeight + 0.5);
  await expect(page.locator('.boosterDock')).toHaveCount(0);
  expect(layout.statusChildCount).toBe(4);
  expect(layout.menu.left).toBeGreaterThanOrEqual(layout.hud.left);
  expect(layout.menu.right).toBeLessThanOrEqual(layout.hud.right + 0.5);
  expect(layout.menu.bottom).toBeLessThanOrEqual(layout.hud.bottom + 0.5);
  expect(layout.menu.width).toBeGreaterThanOrEqual(44);
  expect(layout.menu.width).toBeLessThanOrEqual(64);
  expect(layout.progress.top - layout.hud.bottom).toBeGreaterThanOrEqual(4);
  expect(layout.arena.top - layout.progress.bottom).toBeGreaterThanOrEqual(4);
  expect(layout.levelFontSize).toBeGreaterThanOrEqual(12);
  expect(layout.progressFontSize).toBeGreaterThanOrEqual(12);
  expect(layout.ballVisual.width).toBeLessThanOrEqual(38);
  expect(layout.timerVisual.width).toBeLessThanOrEqual(38);
  expect(layout.goldVisual.width).toBeLessThanOrEqual(38);
  expect(layout.timeOverflow).toBeLessThanOrEqual(1);
  expect(layout.ballCard.width).toBeLessThan(layout.goldCard.width);
  expect(layout.goldCard.width).toBeLessThan(layout.timerCard.width);
  expect(layout.timerValueFontSize).toBeGreaterThan(layout.ballValueFontSize);
  expect(layout.moneyFit).toBe('tight');
  expect(layout.moneyFontSize).toBeLessThan(layout.timerValueFontSize);
  expect(layout.wallet.left).toBeGreaterThan(layout.goldCard.left);
  expect(layout.wallet.right).toBeLessThan(layout.goldCard.right - 1);
  expect(layout.walletOverflow).toBeLessThanOrEqual(1);
  expect(layout.runGainOverflow).toBeLessThanOrEqual(1);
  expect(Math.abs(
    (layout.wallet.top + layout.wallet.height / 2) -
    (layout.runGain.top + layout.runGain.height / 2),
  )).toBeLessThan(3);
  expect(layout.wallet.right).toBeLessThanOrEqual(layout.runGain.left + .5);
  expect(layout.runGain.right).toBeLessThan(layout.goldCard.right - 1);
  expect(layout.arena.height).toBeGreaterThan(500);

  await page.locator('#gameUtilityClose').click();
  await expect(page.locator('#gameUtilityOverlay')).not.toHaveClass(/open/);
  await page.locator('#gameUtilityMenuButton').click();
  await expect(page.locator('#gameUtilityOverlay')).toHaveClass(/open/);
  await expect(page.locator('#restart')).toBeVisible();
  await page.locator('.gameUtilityActions').evaluate(async actions => {
    const animations = [...actions.querySelectorAll('.utilityAction')]
      .flatMap(action => action.getAnimations());
    await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  });
  const menuLayout = await page.evaluate(() => {
    const actions = document.querySelector('.gameUtilityActions')!.getBoundingClientRect();
    const close = document.querySelector('#gameUtilityClose')!.getBoundingClientRect();
    const home = document.querySelector('#gameToHome')!.getBoundingClientRect();
    return {
      viewportHeight: innerHeight,
      actionsTop: actions.top,
      closeTop: close.top,
      closeBottom: close.bottom,
      homeTop: home.top,
    };
  });
  expect(menuLayout.actionsTop).toBeLessThan(menuLayout.viewportHeight * .15);
  expect(menuLayout.closeTop).toBeLessThan(menuLayout.homeTop);
  expect(menuLayout.closeBottom).toBeLessThanOrEqual(menuLayout.homeTop);
  await page.locator('#gameUtilityClose').click();
  await expect(page.locator('#gameUtilityOverlay')).not.toHaveClass(/open/);
});

test('Level 89 preserves the arena ratio and applies its world progression', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  await page.locator('#adminLevel').evaluate((input: HTMLInputElement) => {
    input.value = '89';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#adminGoLevel').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#level')).toHaveText('89');
  await expect(page.locator('#difficulty')).toContainText('7 enemies');
  await expect(page.locator('#difficulty')).toContainText('World 5');

  await expect.poll(async () => page.evaluate(() => {
    const board = document.querySelector('.boardWrap')!.getBoundingClientRect();
    const inputCanvas = document.querySelector<HTMLCanvasElement>('#game')!;
    const phaserCanvas = document.querySelector<HTMLCanvasElement>('#phaserArena canvas')!;
    if (!phaserCanvas.width || !phaserCanvas.height) return false;
    const renderedRatio = board.width / board.height;
    const inputRatio = inputCanvas.width / inputCanvas.height;
    const phaserRatio = phaserCanvas.width / phaserCanvas.height;
    return Math.abs(renderedRatio - inputRatio) < 0.012 &&
      Math.abs(renderedRatio - phaserRatio) < 0.012;
  })).toBe(true);

  const bounds = await page.locator('#phaserArena').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(720);
});
