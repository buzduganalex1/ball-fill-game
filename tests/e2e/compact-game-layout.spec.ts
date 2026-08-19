import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 720 } });

test('gameplay HUD, arena, and booster dock fit a compact Android viewport', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

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
      boosters: rect('.boosterDock'),
      boosterViewport: rect('.boosterViewport'),
      fifthBooster: rect('#destroyBall'),
      menu: rect('.gameUtilityMenuButton'),
    };
  });

  expect(layout.app.bottom).toBeLessThanOrEqual(layout.innerHeight + 0.5);
  expect(layout.boosters.bottom).toBeLessThanOrEqual(layout.innerHeight + 0.5);
  expect(layout.boosters.left).toBeGreaterThanOrEqual(0);
  expect(layout.boosters.right).toBeLessThanOrEqual(layout.innerWidth + 0.5);
  expect(layout.fifthBooster.right).toBeLessThanOrEqual(layout.boosterViewport.right + 0.5);
  expect(layout.menu.bottom).toBeLessThanOrEqual(layout.boosters.bottom + 0.5);
  expect(layout.arena.height).toBeGreaterThan(300);
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
