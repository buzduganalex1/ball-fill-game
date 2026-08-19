import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 720 } });

async function createStarterSave(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await expect.poll(async () => page.evaluate(() => (
    Object.keys(localStorage).some(key => key.endsWith('.ballFillSave'))
  ))).toBe(true);
  await page.addInitScript(() => {
    const requestedStars = sessionStorage.getItem('__worldMapSeedStars');
    if (requestedStars === null) return;
    const key = Object.keys(localStorage).find(candidate => candidate.endsWith('.ballFillSave'));
    if (!key) return;
    const save = JSON.parse(localStorage.getItem(key) || '{}');
    let remaining = Number(requestedStars);
    save.version = 2;
    save.currentLevel = 20;
    save.highestCompletedLevel = 20;
    save.grandfatheredWorldCount = 1;
    save.tutorialSeen = true;
    save.levelProgress = Array.from({ length: 20 }, (_, index) => {
      const earned = Math.min(3, Math.max(0, remaining));
      remaining -= earned;
      return {
        level: index + 1,
        stars: earned,
        bestTimeLeft: earned ? 12 + index / 10 : 0,
        fewestBallsUsed: earned ? 4 : 0,
        bestCoins: earned ? 6 + index : 0,
        attempts: earned ? 2 : 0,
      };
    });
    localStorage.setItem(key, JSON.stringify(save));
  });
}

async function seedWorldProgress(page: Page, stars: number): Promise<void> {
  await page.evaluate((totalStars) => {
    sessionStorage.setItem('__worldMapSeedStars', String(totalStars));
  }, stars);
  await page.reload();
}

test('home world map is readable, touch friendly, and shows twenty selectable levels', async ({ page }) => {
  await createStarterSave(page);
  await seedWorldProgress(page, 8);

  await expect(page.locator('#homeScreen')).toHaveClass(/active/);
  await expect(page.locator('#homeScreen .homeStats')).toHaveCount(0);
  await expect(page.locator('#homeCollectionCard')).toHaveCount(0);
  await expect(page.locator('#homeLevelGrid .homeLevelTile')).toHaveCount(20);
  await expect(page.locator('#homeWorldName')).toHaveText('CRIMSON FIELDS');
  await expect(page.locator('#homeWorldStars')).toHaveText('8 / 60');

  const sizing = await page.evaluate(() => {
    const app = document.querySelector<HTMLElement>('#homeScreen .homeApp')!;
    const grid = document.querySelector<HTMLElement>('#homeLevelGrid')!;
    const arrow = document.querySelector<HTMLElement>('#homeWorldNext')!;
    const tile = document.querySelector<HTMLElement>('.homeLevelTile')!;
    const tileNumber = document.querySelector<HTMLElement>('.homeLevelTile strong')!;
    const tileStars = document.querySelector<HTMLElement>('.homeLevelTileStars')!;
    const earnedStar = document.querySelector<HTMLElement>('.homeLevelTile[data-level="3"] .homeLevelTileStar.earned')!;
    const missingStar = document.querySelector<HTMLElement>('.homeLevelTile[data-level="3"] .homeLevelTileStar.missing')!;
    const detailStars = document.querySelector<HTMLElement>('#homeLevelDetailStars')!;
    const detailTitle = document.querySelector<HTMLElement>('#homeLevelDetailTitle')!;
    const resultLabel = document.querySelector<HTMLElement>('.homeLevelBestStats small')!;
    const resultValue = document.querySelector<HTMLElement>('.homeLevelBestStats strong')!;
    const hero = document.querySelector<HTMLElement>('.homeHero')!;
    const worldMap = document.querySelector<HTMLElement>('#homeWorldMap')!;
    return {
      noHorizontalOverflow: app.scrollWidth <= app.clientWidth + 1,
      heroComesFirst: hero.offsetTop < worldMap.offsetTop,
      columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      arrowWidth: arrow.getBoundingClientRect().width,
      arrowHeight: arrow.getBoundingClientRect().height,
      tileHeight: tile.getBoundingClientRect().height,
      levelNumberFont: parseFloat(getComputedStyle(tileNumber).fontSize),
      levelStarsFont: parseFloat(getComputedStyle(tileStars).fontSize),
      earnedStarColor: getComputedStyle(earnedStar).color,
      missingStarColor: getComputedStyle(missingStar).color,
      missingStarOpacity: getComputedStyle(missingStar).opacity,
      detailStarsFont: parseFloat(getComputedStyle(detailStars).fontSize),
      detailTitleFont: parseFloat(getComputedStyle(detailTitle).fontSize),
      resultLabelFont: parseFloat(getComputedStyle(resultLabel).fontSize),
      resultValueFont: parseFloat(getComputedStyle(resultValue).fontSize),
    };
  });
  expect(sizing.noHorizontalOverflow).toBe(true);
  expect(sizing.heroComesFirst).toBe(true);
  expect(sizing.columns).toBe(5);
  expect(sizing.arrowWidth).toBeGreaterThanOrEqual(44);
  expect(sizing.arrowHeight).toBeGreaterThanOrEqual(44);
  expect(sizing.tileHeight).toBeGreaterThanOrEqual(50);
  expect(sizing.levelNumberFont).toBeGreaterThanOrEqual(17);
  expect(sizing.levelStarsFont).toBeGreaterThanOrEqual(11);
  expect(sizing.missingStarColor).not.toBe(sizing.earnedStarColor);
  expect(sizing.missingStarOpacity).toBe('1');
  expect(sizing.detailStarsFont).toBeGreaterThanOrEqual(16);
  expect(sizing.detailTitleFont).toBeGreaterThanOrEqual(18);
  expect(sizing.resultLabelFont).toBeGreaterThanOrEqual(8);
  expect(sizing.resultValueFont).toBeGreaterThanOrEqual(16);

  await page.locator('.homeLevelTile[data-level="1"]').click();
  await expect(page.locator('#homeLevelDetailTitle')).toHaveText('LEVEL 1');
  await expect(page.locator('#homeLevelDetailStars')).toHaveText('★★★');
  await expect(page.locator('#homeLevelAttempts')).toHaveText('2 ATTEMPTS');
  await expect(page.locator('#homeLevelBestTime')).toHaveText('12.0s');
  await page.locator('#homeLevelPlay').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  await expect(page.locator('#level')).toHaveText('1');
});

test('world two previews as locked at 49 stars and unlocks at 50', async ({ page }) => {
  await createStarterSave(page);
  await seedWorldProgress(page, 49);

  await page.locator('#homeWorldNext').click();
  await expect(page.locator('#homeWorldNumber')).toHaveText('WORLD 2');
  await expect(page.locator('#homeWorldMap')).toHaveClass(/lockedWorld/);
  await expect(page.locator('#homeWorldGateCopy')).toContainText('LOCKED');
  await expect(page.locator('#homeLevelPlay')).toBeDisabled();

  await seedWorldProgress(page, 50);
  await page.locator('#homeWorldNext').click();
  await expect(page.locator('#homeWorldMap')).not.toHaveClass(/lockedWorld/);
  await expect(page.locator('.homeLevelTile[data-level="21"]')).toHaveAttribute('data-state', 'available');
  await expect(page.locator('#homeLevelPlay')).toBeEnabled();
});
